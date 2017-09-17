<?php
require_once (INCLUDE_DIR . 'class.signal.php');
require_once ('config.php');

class TinyMCEPlugin extends Plugin {
    /**
     * Which config to use (in config.php)
     *
     * @var string
     */
    public $config_class = 'TinyMCEPluginConfig';
    
    /**
     * Run on every instantiation of osTicket..
     * needs to be concise
     *
     * {@inheritdoc}
     *
     * @see Plugin::bootstrap()
     */
    function bootstrap() {
        ob_start();
        global $cfg;
        register_shutdown_function(function () {
            $html = ob_get_clean();
            $javascript = file_get_contents(__DIR__ . '/tinymce-osticket.js');
            $javascript = $this->handleConfig($javascript);
            $html = preg_replace('/<script.*redactor.*<\/script>/', '', $html);
            print str_replace("</head>", $this->includeTinyMCE() . "<script>" 
            . $javascript 
            . "</script></head>", $html);
        });
    }
    
    function includeTinyMCE(){
        return "<script type=\"text/javascript\" src=\"" 
            . ROOT_PATH . "include/" . $this->getInstallPath() 
            . "/tinymce/tinymce.min.js\"></script>";
    }
    
    function handleConfig($html){
        $config = $this->getConfig();
        $html = str_replace("{TINYMCE_HEIGHT}", $config->get('height'), $html);
        $html = str_replace("{TINYMCE_THEME}", $config->get('theme'), $html);
        $html = str_replace("{TINYMCE_PLUGINS}", implode(' ', array_keys($config->get('plugins'))), $html);
        $html = str_replace("{TINYMCE_MENUBAR}", (boolval($config->get('menubar')) ? 'true':'false'), $html);
        $html = str_replace("{TINYMCE_POWERED_BY}", (boolval($config->get('poweredby')) ? 'true':'false'), $html);
        $html = str_replace("{TINYMCE_TOOLBAR}", $config->get('toolbar'), $html);
        return $html;
    }
    
    /**
     * Required stub.
     *
     * {@inheritdoc}
     *
     * @see Plugin::uninstall()
     */
    function uninstall() {
        $errors = array ();
        parent::uninstall ( $errors );
    }
    
    /**
     * Plugins seem to want this.
     */
    public function getForm() {
        return array ();
    }
}


