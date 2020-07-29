
````
export PROJJECT=[PROJECT-NAME]
export ZONE=europe-west1-b
````

### Configure Service Account for Jenkins
Create a service account for Jenkins, grant it necessary roles and export the service account to a JSON key file in 
Cloud Shell.
````
gcloud iam service-accounts create jenkins-sa --display-name "jenkins-sa"

gcloud projects add-iam-policy-binding $PROJECT \
    --member "serviceAccount:jenkins-sa@$PROJECT.iam.gserviceaccount.com" \
    --role "roles/source.reader"

gcloud projects add-iam-policy-binding $PROJECT \
    --member "serviceAccount:jenkins-sa@$PROJECT.iam.gserviceaccount.com" \
    --role "roles/viewer"

gcloud projects add-iam-policy-binding $PROJECT \
    --member "serviceAccount:jenkins-sa@$PROJECT.iam.gserviceaccount.com" \
    --role "roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT \
    --member "serviceAccount:jenkins-sa@$PROJECT.iam.gserviceaccount.com" \
    --role "roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding $PROJECT \
    --member "serviceAccount:jenkins-sa@$PROJECT.iam.gserviceaccount.com" \
    --role "roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding $PROJECT \
    --member "serviceAccount:jenkins-sa@$PROJECT.iam.gserviceaccount.com" \
    --role "roles/container.developer"

gcloud iam service-accounts keys create ~/jenkins-sa-key.json \
    --iam-account "jenkins-sa@$PROJECT.iam.gserviceaccount.com"
````
Download the key file into your local machine.

### Create a Kubernetes Cluster 
This will run both Jenkins and your application

````
gcloud container clusters create jenkins-cd \
    --zone $ZONE \
    --num-nodes 2 \
    --machine-type n1-standard-2 \
    --cluster-version latest \
    --service-account "jenkins-sa@$PROJECT.iam.gserviceaccount.com"

gcloud container clusters get-credentials jenkins-cd --zone europe-west1-b

kubectl cluster info
````

Add yourself as a cluster admin in the clusters RBAC:
````
kubectl create clusterrolebinding cluster-admin-binding \
    --clusterrole=cluster-admin \
    --user=$(gcloud config get-value account)
````

### Install Helm

````
wget https://get.helm.sh/helm-v3.2.1-linux-amd64.tar.gz
tar zxfv helm-v3.2.1-linux-amd64.tar.gz
cp linux-amd64/helm .
./helm repo add stable https://kubernetes-charts.storage.googleapis.com
./helm version
````

## Jenkins

### Installing 
````
./helm install cd-jenkins -f jenkins/values.yaml stable/jenkins --version 1.7.3 --wait
kubectl get pods
````
Give jenkins the cluster-admin role. This is required so that Jenkins can create Kubernetes namespaces and any other
resources that the app requires. For production use, you should catalog the individual permissions necessary and apply 
them to the service account individually.

````
kubectl create clusterrolebinding jenkins-deploy \
    --clusterrole=cluster-admin \
    --serviceaccount=default:cd-jenkins
````
Set up port forwarding
````
export JENKINS_POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/component=jenkins-master" -l "app.kubernetes.io/instance=cd-jenkins" -o jsonpath="{.items[0].metadata.name}") 

kubectl port-forward $JENKINS_POD_NAME 8080:8080 >> /dev/null & 

kubectl get svc
````
### Connecting

Navigate to the Jenkins UI by connecting to port 8080 (command shell button). The username is ``admin`` and password
is retrieved using:
````
printf $(kubectl get secret cd-jenkins -o jsonpath="{.data.jenkins-admin-password}" | base64 --decode);echo
````

## Deploying the application

You will be deploying to two environments:
- *Production* - The live site that your users access
- *Canary* - A smaller capacity site that recieves only a percentage of your user traffic.

### Build images with Docker

````
cd demo-backend
docker build .
docker images #To Get the image ID
docker tag <IMAGE-ID> gcr.io/gke-travisci-deployment/demo-backend:1.0.0
docker push gcr.io/gke-travisci-deployment/demo-backend:1.0.0

cd ../demo-frontend
docker build .
docker images #To Get the image ID
docker tag <IMAGE-ID> gcr.io/gke-travisci-deployment/demo-frontend:1.0.0
docker push gcr.io/gke-travisci-deployment/demo-frontend:1.0.0
````

#### Deploy manually with Kubernetes 

Deploy the Kubernetes charts using the image we have just built. 


## Notes

1. Make sure branches (most likely feature branches) do not have ``/`` in their name as this will