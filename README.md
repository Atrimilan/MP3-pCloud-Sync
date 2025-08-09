# MP3-pCloud-Sync

## Purpose of this project

This application is used to automatically upload my private Minecraft server backups to [pCloud](https://www.pcloud.com/).

I host private Minecraft servers using Crafty Controller on a remote Oracle VPS, and they are backed up daily on the machine.
I created this application because I wanted to reduce the risk of losing my worlds by automatically uploading backups to a cloud.

> [!TIP]
> My [backup_sync.js](app/backup_sync.js) script is designed to suit my needs, but you could rework it to suit yours. You could also simply reuse my [pcloud_service.js](app/pcloud_service.js) script at your liking.

## How to use

Open a terminal and run the following:
```sh
npm install
```

Rename [.env.template](.env.template) to `.env`, fill in the fields with your pCloud credentials and the API URL you need:
* https://eapi.pcloud.com for the European API
* https://api.pcloud.com for the United States API

In the [app](app) directory, add a `backup_paths.json` file and specify all parent folders that contain a ZIP file that must be synced to pCloud, for example:
```json
[
    "/var/opt/minecraft/crafty/crafty-4/backups/world1",
    "/var/opt/minecraft/crafty/crafty-4/backups/world2"
]
```

> [!IMPORTANT]
> You must only specify directories that contain a unique `.zip` file.
> If you want to allow zero or multiple files, feel free to adapt the code to your needs.

Now, to sync your backups once, you simply need to execute:
```sh
npm run start
```

## Authentication error

If you run the script on your local computer, and have already logged in to https://my.pcloud.com/ once, you will not get the authentication error.

However, if you are using this script on a remote VPS, or if you are using a proxy or VPN that changes your IP address, you will get the error `Error: Authentication failed: Please provide 'code'.`.

This is a security feature that requires you to provide a code sent by email to confirm your identity. In this case, you just need to log in to https://my.pcloud.com/ using your pCloud credentials, to specify the code received by email, and the script should work because your IP address is recognized when logging in through the script.

But if you are using a VPS without any GUI or browser installed, you may be wondering how to open the pCloud login page. The easiest way is to open an SSH tunnel to your local machine to create a SOCKS proxy as follow:
```sh
ssh -D 1080 USER@YOUR-VPS-IP-ADDRESS -i "path/to/your/ssh/private_key_rsa"
```

You can then open your browser with the SOCKS proxy server to simulate the use of your VPS IP address:
```sh
"path/to/your/browser.exe" --proxy-server="socks5://127.0.0.1:1080"
```
> [!WARNING]
> Make sure you have completely shutdown your browser before running this command, otherwise it will not work. Check your task manager, as your browser may be running in the background.

Now you can simply connect to https://my.pcloud.com/ in your browser, in order to authenticate with a code you'll receive by email. If you have any problems, you can check your IP address at https://whatismyipaddress.com/ to see whether the SOCKS proxy is working or not.

> [!TIP]
> A non-expiring authentication token is created and stored to `./app/auth_token.txt` after your first login using the script. This token will be used for all future executions of the script, and you won't have to go through the authentication process on the web page again. **But make sure to keep this token private!**

## Configure automatic syncing

This script is not that useful if you're executing it manually ; you may want to use a cron job instead, or anything that can trigger this application to automatically upload your files.

For example, starting a cron job using PM2, to automatically run a backup everyday at 7am:
```sh
pm2 start app/backup_sync.js --cron "0 7 * * *" --name backup_sync --no-autorestart --time
```

> [!NOTE] 
> The `--no-autorestart` flag is required because I want to run the script only once everyday, otherwise PM2 will restart the script continuously.

Check if everything works:
```sh
pm2 log backup_sync --lines 200
```

## More info

If you want to reuse this project, you'll probably need to take a look at the pCloud documentation here: https://docs.pcloud.com/.

If you want more information on what I'm using, feel free to take a look at these repositories:
* [Free Oracle VPS hosting](https://github.com/AmberstoneDream/FreeVirtualMachineCloudHosting)
* [Crafty Controller administration panel](https://github.com/AmberstoneDream/ProxyServerResearch)
* [Website of my private Minecraft network](https://github.com/Atrimilan/MP3-Docs)
