pipeline {

  environment {
    PROJECT         = "gke-travisci-deployment" //CHANGE ME
    APP_NAME        = "demo"                    //CHANGE ME
    FE_SVC_NAME     = "${APP_NAME}-frontend"
    CLUSTER         = "jenkins-cd"
    CLUSTER_ZONE    = "europe-west1-b"          //CHANGE ME
    BASE_IMAGE_TAG  = "gcr.io/${PROJECT}/${APP_NAME}"
    JENKINS_CRED    = "${PROJECT}"
    VERSION         = "${BRANCH_NAME}.${BUILD_NUMBER}"
  }

  agent {
    kubernetes {
      label 'sample-app'
      defaultContainer 'jnlp'
      yaml """
        apiVersion: v1
        kind: Pod
        metadata:
        labels:
          component: ci
        spec:
          # Use service account that can deploy to all namespaces
          serviceAccountName: cd-jenkins
          containers:
          - name: gcloud
            image: gcr.io/cloud-builders/gcloud
            command:
            - cat
            tty: true
          - name: kubectl
            image: gcr.io/cloud-builders/kubectl
            command:
            - cat
            tty: true
        """
    }
  }
  stages {
    stage('Test') {
      steps {
          sh """
            echo 'tests go here'
          """
      }
    }
    stage('Build and push frontend image with Container Builder') {
      steps {
        container('gcloud') {
          sh "PYTHONUNBUFFERED=1 gcloud builds submit -t ${BASE_IMAGE_TAG}-frontend:${VERSION} ./demo-frontend"
        }
      }
    }
    stage('Build and push backend image with Container Builder') {
      steps {
        container('gcloud') {
          sh "PYTHONUNBUFFERED=1 gcloud builds submit -t ${BASE_IMAGE_TAG}-backend:${VERSION} ./demo-backend"
        }
      }
    }

    stage('Deploy Canary') {
      // Canary branch
      when { branch 'canary' }
      steps {
        container('kubectl') {
          sh("kubectl get ns production || kubectl create ns production")

          // Change deployed image in canary to the one we just built
          sh("sed -i 's|gcr.io/${PROJECT}/demo-frontend:.*|gcr.io/${PROJECT}/demo-frontend:${env.BRANCH_NAME}.${env.BUILD_NUMBER}|' ./k8s/canary/frontend-canary.yaml")
          sh("sed -i 's|gcr.io/${PROJECT}/demo-backend:.*|gcr.io/${PROJECT}/demo-backend:${env.BRANCH_NAME}.${env.BUILD_NUMBER}|' ./k8s/canary/backend-canary.yaml")
          step([$class: 'KubernetesEngineBuilder', namespace:'production', projectId: env.PROJECT, clusterName: env.CLUSTER, zone: env.CLUSTER_ZONE, manifestPattern: 'k8s/services', credentialsId: env.JENKINS_CRED, verifyDeployments: false])
          step([$class: 'KubernetesEngineBuilder', namespace:'production', projectId: env.PROJECT, clusterName: env.CLUSTER, zone: env.CLUSTER_ZONE, manifestPattern: 'k8s/canary', credentialsId: env.JENKINS_CRED, verifyDeployments: true])
        }
      }
    }
    stage('Deploy Production') {
      // Production branch
      when { branch 'master' }
      steps{
        container('kubectl') {
          sh("kubectl get ns production || kubectl create ns production")

          // Change deployed image in production to the one we just built for both the frontend and backend charts
          sh("sed -i 's|gcr.io/${PROJECT}/demo-frontend:.*|gcr.io/${PROJECT}/demo-frontend:${env.BRANCH_NAME}.${env.BUILD_NUMBER}|' ./k8s/production/frontend-deployment.yaml")
          sh("sed -i 's|gcr.io/${PROJECT}/demo-backend:.*|gcr.io/${PROJECT}/demo-backend:${env.BRANCH_NAME}.${env.BUILD_NUMBER}|' ./k8s/production/backend-deployment.yaml")

          step([$class: 'KubernetesEngineBuilder', namespace:'production', projectId: env.PROJECT, clusterName: env.CLUSTER, zone: env.CLUSTER_ZONE, manifestPattern: 'k8s/services', credentialsId: env.JENKINS_CRED, verifyDeployments: false])
          step([$class: 'KubernetesEngineBuilder', namespace:'production', projectId: env.PROJECT, clusterName: env.CLUSTER, zone: env.CLUSTER_ZONE, manifestPattern: 'k8s/production', credentialsId: env.JENKINS_CRED, verifyDeployments: true])
        }
      }
    }
    stage('Deploy Dev') {
      // Developer Branches
      when {
        not { branch 'master' }
        not { branch 'canary' }
      }
      steps {
        container('kubectl') {
          // Create namespace if it doesn't exist
          sh("kubectl get ns ${env.BRANCH_NAME} || kubectl create ns ${env.BRANCH_NAME}")
          // Don't use public load balancing for development branches
//           sh("sed -i.bak 's#LoadBalancer#ClusterIP#' ./k8s/services/frontend.yaml") - Why would you do this? how can you test (manually preview the website) if you cant reach it externally?

          sh("sed -i 's|gcr.io/${PROJECT}/demo-frontend:.*|gcr.io/${PROJECT}/demo-frontend:${env.BRANCH_NAME}.${env.BUILD_NUMBER}|' ./k8s/dev/frontend-dev.yaml")
          sh("sed -i 's|gcr.io/${PROJECT}/demo-backend:.*|gcr.io/${PROJECT}/demo-backend:${env.BRANCH_NAME}.${env.BUILD_NUMBER}|' ./k8s/dev/backend-dev.yaml")

          step([$class: 'KubernetesEngineBuilder', namespace: "${env.BRANCH_NAME}", projectId: env.PROJECT, clusterName: env.CLUSTER, zone: env.CLUSTER_ZONE, manifestPattern: 'k8s/services', credentialsId: env.JENKINS_CRED, verifyDeployments: false])
          step([$class: 'KubernetesEngineBuilder', namespace: "${env.BRANCH_NAME}", projectId: env.PROJECT, clusterName: env.CLUSTER, zone: env.CLUSTER_ZONE, manifestPattern: 'k8s/dev', credentialsId: env.JENKINS_CRED, verifyDeployments: true])
          echo 'To access your environment run `kubectl proxy`'
          echo "Then access your service via http://localhost:8001/api/v1/proxy/namespaces/${env.BRANCH_NAME}/services/${FE_SVC_NAME}:80/"
        }
      }
    }
  }
}