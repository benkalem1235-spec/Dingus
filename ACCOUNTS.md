# Optional accounts

Players can sign up at `/account.html` with a username and password (12–128 characters). Guests remain welcome. A signed-in account pre-fills the game nickname; native CS nicknames are not reserved or authenticated identities.

The Node host stores salted scrypt password hashes, hashed session and verification tokens in `accounts/accounts.json`, with atomic writes and a persistent writable mount. Keep this directory private and back it up; never publish it. Sessions expire after seven days. Verification links expire after 30 minutes and can only be used once. Password recovery is not implemented; users without email have no recovery option.

## Email delivery

Email signup is disabled until the host is configured. Create a private `config/accounts.env` with:

```
EMAIL_API_KEY=<Resend API key>
EMAIL_FROM=Dingus <verified-sender@your-domain.example>
ACCOUNT_PUBLIC_URL=https://lion-appropriate-style-badly.trycloudflare.com
```

Use the direct HTTPS game host as ACCOUNT_PUBLIC_URL, not the static launcher. Resend requires a verified sender domain. Restart the host after configuration. Do not commit this file. Email accounts cannot log in until verified; signup without email works immediately. The game host must remain running for verification links to work. The tunnel hostname can change if the tunnel is recreated.

## Skins research

Weapons Skins Ultimate supports custom view, player and dropped weapon models, but its author requires AMX Mod X 1.9+, ReHLDS 3.11+, ReAPI and compatible ReGameDLL. This host uses Xash3D/CS16Client, so that plugin has not been installed: its required engine API is unavailable. Source and requirements: https://tornadoamxxhub.com/skinsultimate and https://tornadoamxxhub.com/weapons-skins-ultimate-documentation . A compatible cosmetic system needs a separate implementation and licensed model assets; the current game retains original models and damage.
