
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

### Install Jenkins

````
./helm install cd-jenkins -f jenkins/values.yaml stable/jenkins --version 1.7.3 --wait
kubectl get pods
````