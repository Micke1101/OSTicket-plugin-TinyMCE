# OSTicket-plugin-TinyMCE INSTALLATION

Download the plugin content and place the contents into your include/plugins directory, then enable it and then configure it.

## Download files

For the osticket, go to plugin directory and clone/download-zip there with own directory name, could be as:

1. by cloning: `cd include/plugins && git clone https://github.com/indefero/OSTicket-plugin-TinyMCE.git tinymce`
2. by master lasted: `wget https://github.com/Micke1101/OSTicket-plugin-TinyMCE/archive/master.tar.gz`

## Enabling pluguin

Once files are there, go to admin panel and in plugins select `Add new plugin`, select `TinyMCE` and click install.

## Configuring

First need to link js files, on the server this can be done by two ways:
1. in the plugin directory of tinymce, by linking soft as: `ln -s js/tinymce ../../../js/tinymce`
2. in the plugin directory of tinymce, by copy content to js dir: `cp js/tinymce ../../../js/tinymce`

Once installing go to admin panel and in plugins select it and enable it, once plugin are enabled then configure it by clicking.

## To Remove:

Navigate to admin plugins view, click the checkbox and push the "Delete" button.

The plugin will still be available, you have deleted the config only at this point, 
to remove after deleting, remove the related directory inside plugins directory..

