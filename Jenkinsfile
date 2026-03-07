pipeline {
    agent any

    tools {
        nodejs 'NodeJS-25'
    }

    environment {
        DATABASE_URL = credentials('prod-db-url')
        APP_DIR = '/var/www/pamj-backend'
        JWT_SECRET = '3044ab364298dd4b91bbc1a246823c5b2a833bd325e5d6d6023798c72a8a5137a4ca480f6b0c53ed0a1782e1032bced975c28a13516474d4b0e1a52b8ee52490'
        APP_STATUS = 'DEV'
        MAIL_HOST ='sandbox.smtp.mailtrap.io'
        MAIL_PORT = '2525'
        MAIL_USER = '9d9c67c6e946f7'
        MAIL_PASS = '96023102deb97c
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'git@github.com-backend:hamiltondarryl/app-jeunesse-api.git',
                    credentialsId: 'github-backend-key'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Generate Prisma Client') {
            steps {
                sh 'npx prisma generate'
            }
        }

        stage('Run Database Migrations') {
            steps {
                sh 'npx prisma migrate deploy'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                script {
                    sh "mkdir -p ${APP_DIR}"
                    sh "cp -r dist package.json package-lock.json prisma ${APP_DIR}/"
                    sh "cd ${APP_DIR} && npm ci --only=production"
                    sh "cd ${APP_DIR} && npx prisma generate"
                    sh "pm2 delete pamj-backend || true"
                    sh "cd ${APP_DIR} && pm2 start dist/src/main.js --name pamj-backend"
                    sh "pm2 save"
                }
            }
        }
    }

    post {
        success {
            echo '✅ Backend déployé avec succès !'
        }
        failure {
            echo '❌ Échec du déploiement backend'
        }
    }
}