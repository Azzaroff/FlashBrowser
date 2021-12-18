const {
    app,
    protocol,
    BrowserWindow,
	globalShortcut,
    Menu
} = require('electron');
const {autoUpdater} = require("electron-updater");

const path = require('path');
const Store = require('./store.js');
const contextMenu = require('electron-context-menu');
const { ipcMain } = require('electron')

contextMenu({
	showSaveImageAs: true
});

let mainWindow;

let pluginName = null; //put the right flash plugin in depending on the operating system.
switch (process.platform) {
	case 'win32':
		switch (process.arch) {
			case 'ia32':
			case 'x32':
				pluginName = 'flashver/pepflashplayer32.dll'
				console.log("ran!");
				break
			case 'x64':
				pluginName = 'flashver/pepflashplayer64.dll'
				console.log("ran!");
				break
		}
		break
	case 'linux':
		switch (process.arch) {
			case 'ia32':
			case 'x32':
				pluginName = 'flashver/libpepflashplayer.so' // added and tested :D
				break
			case 'x64':
				pluginName = 'flashver/libpepflashplayer.so'
				break
		}

		app.commandLine.appendSwitch('no-sandbox');
		break
	case 'darwin':
		pluginName = 'flashver/PepperFlashPlayer.plugin'
		break
}
app.commandLine.appendSwitch("disable-renderer-backgrounding");
if (process.platform !== "darwin") {
	app.commandLine.appendSwitch('high-dpi-support', "1");
	//app.commandLine.appendSwitch('force-device-scale-factor', "1");
}
app.commandLine.appendSwitch("--enable-npapi");
app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, pluginName));
//app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname.includes(".asar") ? process.resourcesPath : __dirname, "plugins/" + pluginName));
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('allow-insecure-localhost', 'true');

let sendWindow = (identifier, message) => {
    mainWindow.webContents.send(identifier, message);
};
	
const store = new Store({
  configName: 'user-preferences',
  defaults: {
    windowBounds: { width: 1280, height: 720, max:false }
  }
});

const template = [];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

app.on('ready',   () => {

    let { width, height, isMax } = store.get('windowBounds');
    let filePath = 'filePath';
	console.log("inti param" + process.argv);
	if(process.argv.length >= 2 && process.argv[1].indexOf(".swf") > 1) {
		
		filePath = process.argv[1];
		filePath = filePath.replace(/\\/g, "/");
		filePath =  'file:///' + filePath;
		//open, read, handle file
	}
	if(width < 100 || height < 100) {
		width = 800;
		height = 500;
	}
	

	 
    mainWindow = new BrowserWindow({
        width: width,
        height: height,
		frame: false,
		show:true,
		backgroundColor: '#202124',
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true, 
            plugins: true,
	    contextIsolation: false,
	    enableRemoteModule: true,
	    additionalArguments: [filePath]
        }
    });
    
	
	
   
    mainWindow.loadURL(`file://${__dirname}/browser.html`);

	
	// Modify the user agent for all requests to the following urls.
	const filter = {
	  urls: ['https://*.darkorbit.com/*', 'https://*.whatsapp.com/*']
	}
	mainWindow.webContents.session.webRequest.onBeforeSendHeaders(filter,(details, callback) => {
		
        details.requestHeaders['X-APP'] = app.getVersion();
		details.requestHeaders['User-Agent'] = 'BigpointClient/1.4.6';
		if(details.url.indexOf("whatsapp") > 0) {
			details.requestHeaders['User-Agent'] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15";
		}
        callback({ requestHeaders: details.requestHeaders })
    });
	
    sendWindow("version", app.getVersion());
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
	
	
	
	 
	mainWindow.once('ready-to-show', () => {
		if(isMax) {	
		if(process.platform === "win32"){
			mainWindow.maximize();
			
		}
		else{
			mainWindow.setFullScreen(true)
		}
		
		
	 }
     mainWindow.show()
	})


	// Upper Limit is working of 500 %
	mainWindow.webContents.setVisualZoomLevelLimits(1, 5).then(console.log("Zoom Levels Have been Set between 100% and 500%")).catch((err) => console.log(err));
   
   
    mainWindow.on('resize', () => {
		var isMax = mainWindow.isMaximized() || mainWindow.isFullScreen()
		
		if(isMax) {
			console.log( isMax);
			let { width, height, max } = store.get('windowBounds');
			store.set('windowBounds', { width, height , isMax});		
		}
		else{
			let { width, height } = mainWindow.getBounds();
			store.set('windowBounds', { width, height , isMax});	
		}
        
    });
	globalShortcut.register("CTRL+SHIFT+I", () => {
	 mainWindow.webContents.openDevTools();
	});

	function toggleWindowFullScreen(){
		mainWindow.setFullScreen(!mainWindow.isFullScreen())
	}
	globalShortcut.register("F11", toggleWindowFullScreen);
	globalShortcut.register("Escape", () => mainWindow.setFullScreen(true));
	ipcMain.on('fs-click', toggleWindowFullScreen);

	globalShortcut.register("CmdOrCtrl+=", () => {
		console.log("CmdOrCtrl+");
		mainWindow.webContents.zoomFactor = mainWindow.webContents.getZoomFactor() + 0.2;
	});
	globalShortcut.register("CmdOrCtrl+-", () => {
		mainWindow.webContents.zoomFactor = mainWindow.webContents.getZoomFactor() - 0.2;
	});

	globalShortcut.register("CTRL+SHIFT+F10", () => {
		let session = mainWindow.webContents.session;
        session.clearCache();
        app.relaunch();
        app.exit();
	});
	
	mainWindow.webContents.zoomFactor = 1;
	console.log("checkForUpdatesAndNotify");
	autoUpdater.checkForUpdatesAndNotify();
	

	
	
var {ElectronBlocker} = require('@cliqz/adblocker-electron');
var {fetch} = require('cross-fetch');

ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker)=>{
	blocker.enableBlockingInSession(session.defaultSession);
});
	
	
});

app.on('open-file', (event, path) =>
{
    event.preventDefault();
    console.log(path);
});
exports.test = () => clearCache();
function clearCache() {
	
	let session = mainWindow.webContents.session;
        session.clearCache();
        app.relaunch();
        app.exit();
	
};

exports.sethome = (a) => homeSetter(a);
	
function homeSetter(a){
     store.set('homepage', a );
	 console.log("Favorite url:" + a);
};

exports.setFavorite = (a) => favoriteSetter(a);
	
function favoriteSetter(a){
     let fav =  store.get('favorites');
	 if(fav && fav.indexOf(a) ) {
	     fav.push(a);
	 }
	 else{
		 fav = [a]
	 }
     store.set('favorites', fav);
	 console.log("S url:" + fav);
};




app.on('window-all-closed', () => {
    //if (process.platform !== 'darwin') {
        app.quit();
    //}
});

autoUpdater.on('checking-for-update', () => {
    sendWindow('checking-for-update', '');
});

autoUpdater.on('update-available', () => {
    sendWindow('update-available', '');
});

autoUpdater.on('update-not-available', () => {
    sendWindow('update-not-available', '');
});

autoUpdater.on('error', (err) => {
    sendWindow('error', 'Error: ' + err);
});

autoUpdater.on('download-progress', (d) => {
    sendWindow('download-progress', {
        speed: d.bytesPerSecond,
        percent: d.percent,
        transferred: d.transferred,
        total: d.total
    });
});

autoUpdater.on('update-downloaded', () => {
    sendWindow('update-downloaded', 'Update downloaded');
    autoUpdater.quitAndInstall();
});
