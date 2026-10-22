pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    IMAGE_NAME = 'jeunesse-api'
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    DEPLOY_HOST = 'root@72.62.60.10'
    DEPLOY_PATH = '/opt/deploy/jeunesse/api'
    COMPOSE_PROJECT_NAME = 'jeunesse-api'
    DOCKER_BUILDKIT = '1'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Déploiement VPS NDAMBO') {
      steps {
        sh '''
          set -eu
          ssh -o StrictHostKeyChecking=no "${DEPLOY_HOST}" "
            set -euo pipefail
            test -f /etc/jeunesse/app.yaml
            mkdir -p ${DEPLOY_PATH}/config
            cd ${DEPLOY_PATH}
            if [ -d .git ]; then
              git fetch origin main
              git checkout main
              git reset --hard origin/main
            fi
            install -m 644 /etc/jeunesse/app.yaml config/app.yaml
            export IMAGE_TAG=${IMAGE_TAG}
            docker compose -p jeunesse-api up -d --build
            sleep 8
            curl -fsS http://127.0.0.1:4100/api/health
            docker compose -p jeunesse-api ps
          "
        '''
      }
    }
  }

  post {
    success {
      echo "API jeunesse déployée sur le VPS NDAMBO (${IMAGE_NAME}:${IMAGE_TAG})"
    }
    failure {
      echo 'Échec du déploiement API jeunesse'
    }
  }
}
