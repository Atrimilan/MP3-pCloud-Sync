# MP3-pCloud-Sync

## Description

This application is used to automatically upload my private Minecraft server backups to [pCloud](https://www.pcloud.com/).

I host private Minecraft servers using Crafty Controller on a remote Oracle VPS, and they are backed up daily.
I created this application because I wanted to reduce the risk of losing my worlds by automatically uploading backups to a cloud.

> [!TIP]
> My [backup_sync.js](app/backup_sync.js) script is designed to suit my needs, but you could rework it to suit yours. You could also simply reuse my [pcloud_service.js](app/pcloud_service.js) script at your liking.

## How to use

Open a terminal and run the following :
```sh
npm install
```

Rename [.env.template](.env.template) to `.env`, fill in the fields with your pCloud credentials and the API URL you need :
* https://eapi.pcloud.com for the EU
* https://api.pcloud.com for the US

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

Now, to sync your backups, you simply need to execute :
```sh
npm run start
```

> [!TIP]
> This script is not that useful if you're executing it manually ; you may want to use a cron job instead, or anything that can trigger this application to automatically upload your files.

## More info

If you want to reuse this project, you'll probably need to take a look at the pCloud documentation here : https://docs.pcloud.com/.

If you want more information on what I'm using, feel free to take a look at these repositories :
* [Free Oracle VPS hosting](https://github.com/AmberstoneDream/FreeVirtualMachineCloudHosting)
* [Crafty Controller administration panel](https://github.com/AmberstoneDream/ProxyServerResearch)
* [Website of my private Minecraft network](https://github.com/Atrimilan/MP3-Docs)
