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
        MAIL_PASS = '96023102deb97c'
    }

    stages {
        stage('Debug - Vérification des variables') {
            steps {
                script {
                    // Affiche les variables (les secrets seront masqués automatiquement)
                    echo "=== VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT ==="
                    echo "APP_DIR = ${env.APP_DIR}"
                    echo "APP_DIR = ${credentials('prod-db-url')}"
                    echo "APP_STATUS = ${env.APP_STATUS}"
                    echo "MAIL_HOST = ${env.MAIL_HOST}"
                    echo "MAIL_PORT = ${env.MAIL_PORT}"
                    
                    // Vérification de DATABASE_URL (devrait être masquée)
                    if (env.DATABASE_URL) {
                        echo "✅ DATABASE_URL est définie (valeur masquée)"
                    } else {
                        echo "❌ DATABASE_URL n'est pas définie"
                    }
                    
                    // Vérification des credentials Mailtrap
                    if (env.MAIL_USER) {
                        echo "MAIL_USER = ${env.MAIL_USER}" // Sera affiché en clair !
                    }
                    if (env.MAIL_PASS) {
                        echo "✅ MAIL_PASS est définie (valeur masquée automatiquement)"
                    }
                    
                    // Afficher TOUTES les variables d'env (debug uniquement)
                    sh 'printenv | sort'
                }
            }
        }

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'git@github.com-backend:hamiltondarryl/app-jeunesse-api.git',
                    credentialsId: 'github-backend-key'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci --legacy-peer-deps'
            }
        }

        stage('Generate Prisma Client') {
            steps {
                sh 'npx prisma generate'
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
                    sh "cd ${APP_DIR} && npm ci --legacy-peer-deps"
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