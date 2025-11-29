# Configuration Vercel pour éviter les erreurs CORS

## Problème
L'application rencontre des erreurs CORS lors de l'appel direct au nœud RPC Casper depuis le navigateur :
```
Access to XMLHttpRequest at 'https://node.testnet.casper.network/rpc' has been blocked by CORS policy
```

## Solution
Utiliser le proxy API serverless qui est déjà implémenté dans `/frontend/api/casper-rpc.ts`.

## Configuration des variables d'environnement Vercel

### Étape 1 : Supprimer/Modifier la variable VITE_CASPER_RPC_URL

1. Aller sur votre projet Vercel : https://vercel.com/dashboard
2. Sélectionner le projet `caspernews`
3. Aller dans **Settings** → **Environment Variables**
4. Chercher `VITE_CASPER_RPC_URL`
5. **Option A** : Supprimer complètement cette variable (recommandé - le code utilisera `/api/casper-rpc` par défaut)
6. **Option B** : Modifier la valeur pour `/api/casper-rpc`

### Étape 2 : Redéployer l'application

Après avoir modifié les variables d'environnement :
1. Aller dans **Deployments**
2. Cliquer sur les trois points (...) du dernier déploiement
3. Sélectionner **Redeploy**
4. Cocher **Use existing Build Cache** pour accélérer
5. Cliquer sur **Redeploy**

## Vérification

Après le redéploiement, vérifier dans la console du navigateur que les logs affichent :
```
📋 Submitting to RPC: /api/casper-rpc
```

Au lieu de :
```
📋 Submitting to RPC: https://node.testnet.casper.network/rpc
```

## Architecture de la solution

```
Frontend (Browser)
    ↓
    fetch('/api/casper-rpc', {...})  ← Pas de CORS car même domaine
    ↓
Vercel Serverless Function (frontend/api/casper-rpc.ts)
    ↓
    fetch('https://node.testnet.casper.network/rpc', {...})  ← OK, appel serveur-à-serveur
    ↓
Casper RPC Node
```

## Variables d'environnement correctes

Votre fichier `.env` (pour le développement local) ou les variables Vercel (pour la production) devraient ressembler à :

```env
# Casper Network Configuration
VITE_CASPER_NETWORK=casper-test
VITE_CONTRACT_HASH=hash-f49d339a1e82cb95cc1ce2eea5c0c7589e8694d3678d0ab9432e57ea00e1d1df

# RPC Endpoint - Use proxy to avoid CORS
VITE_CASPER_RPC_URL=/api/casper-rpc

# Application Configuration
VITE_APP_NAME="Casper News"
VITE_APP_VERSION=1.0.0
```

## Troubleshooting

Si le problème persiste après le redéploiement :

1. **Vider le cache du navigateur** : Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)
2. **Vérifier les variables d'environnement** dans Vercel Settings
3. **Vérifier les logs Vercel** pour s'assurer que la fonction API est déployée
4. **Tester l'endpoint API directement** : `curl https://votre-app.vercel.app/api/casper-rpc -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"info_get_status","params":[],"id":1}'`
