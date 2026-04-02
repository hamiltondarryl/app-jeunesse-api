pipeline {
    agent any

    tools {
        nodejs 'NodeJS-25'
    }

    environment {
        DATABASE_URL = 'postgresql://hamilton:victoire241@@localhost/pamj_db?schema=public'
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

        stage('Install last version prisma') {
            steps {
                sh 'npm i --save-dev prisma@latest'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci --legacy-peer-deps --force --no-audit --no-fund'
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

            sh "sudo rm -rf ${APP_DIR}"

            sh "mkdir -p ${APP_DIR}"

            sh "sudo chown -R jenkins:jenkins ${APP_DIR}"
            sh "chmod -R 755 ${APP_DIR}"

            sh "cp -r dist package.json package-lock.json prisma ${APP_DIR}/"
            
            // ✅ CRÉATION DU FICHIER .env AVEC LA BONNE URL
            sh """
                cd ${APP_DIR}
                echo 'DATABASE_URL="postgresql://hamilton:victoire241@@localhost/pamj_db?schema=public"' > .env
                echo 'JWT_SECRET=${JWT_SECRET}' >> .env
                echo 'APP_STATUS=${APP_STATUS}' >> .env
                echo 'MAIL_HOST=${MAIL_HOST}' >> .env
                echo 'MAIL_PORT=${MAIL_PORT}' >> .env
                echo 'MAIL_USER=${MAIL_USER}' >> .env
                echo 'MAIL_PASS=${MAIL_PASS}' >> .env
            """
            
            sh "cd ${APP_DIR} && npm ci --legacy-peer-deps --force --no-audit --no-fund"

             sh """
                cd ${APP_DIR}
                rm -rf node_modules package-lock.json
                npm cache clean --force
                npm ci --legacy-peer-deps --no-audit --no-fund
            """

            
            sh "cd ${APP_DIR} && npx prisma generate"
            
            def pm2Path = "/root/.nvm/versions/node/v24.14.0/bin/pm2"
            
            sh "${pm2Path} delete main || true"
            sh "cd ${APP_DIR} && ${pm2Path} start dist/src/main.js --name main --update-env"
            sh "${pm2Path} save"
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