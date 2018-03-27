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
     * Singleton reference to itself, used for static functions to find the one object.
     * @var type 
     */
    static $instance = null;

    /**
     * Explicitly define a constructor, to wrap a $this reference as $instance
     * @param type $id
     */
    public function __construct($id) {
        parent::__construct($id);
        self::$instance = $this;
    }

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
        register_shutdown_function(function () {
            $html = ob_get_clean();
            $javascript = file_get_contents(__DIR__ . '/tinymce-config.js');
            $javascript = TinyMCEPlugin::$instance->handleConfig($javascript);
            $html = preg_replace('/<script[^<]*redactor[^<]*><\/script>/', '', $html);
            print str_replace("</head>", TinyMCEPlugin::$instance->includeTinyMCE() . "<script>" 
            . $javascript 
            . "</script><script type=\"text/javascript\" src=\"" 
                    . ROOT_PATH . "include/" . TinyMCEPlugin::$instance->getInstallPath() 
					. "/tinymce-osticket.min.js\"></script></head>", $html);
        });
    }
    
    function includeTinyMCE(){
        $config = TinyMCEPlugin::$instance->getConfig();
        switch($config->get('jsfile')){
            case 'cloud':
                return "<script type=\"text/javascript\" src=\"https://cloud.tinymce.com/stable/tinymce.min.js?apiKey=" . $config->get('apikey') . "\"></script>";
            default:
                return "<script type=\"text/javascript\" src=\"" 
                    . ROOT_PATH . "js/tinymce/tinymce.min.js\"></script>";
        }
        return "";
    }
    
    function handleConfig($html){
        global $thisstaff;
        $config = TinyMCEPlugin::$instance->getConfig();
        $lang = Internationalization::getCurrentLanguage();
        $html = str_replace("{TINYMCE_HEIGHT}", $config->get('height'), $html);
        $html = str_replace("{TINYMCE_THEME}", $config->get('theme'), $html);
        $html = str_replace("{TINYMCE_SKIN}", $config->get('skin'), $html);
        $html = str_replace("{TINYMCE_PLUGINS}", ((is_array($config->get('plugins'))) ? implode(' ', array_keys($config->get('plugins'))) : '') . (($config->get('doautosave'))?" autosave":""), $html);
        $html = str_replace("{TINYMCE_MENUBAR}", ( !! ($config->get('menubar')) ? 'true':'false'), $html);
        $html = str_replace("{TINYMCE_POWERED_BY}", ( !! ($config->get('poweredby')) ? 'true':'false'), $html);
		$html = str_replace("{TINYMCE_BROWSER_SPELLCHECK}", ( !! ($config->get('browserspellcheck')) ? 'true':'false'), $html);
        $html = str_replace("{TINYMCE_STAFF_PLUGINS}", ($thisstaff ? ' autolock signature contexttypeahead cannedresponses':''), $html);
        $html = str_replace("{TINYMCE_LANGUAGE}", ((file_exists($_SERVER[DOCUMENT_ROOT] . ROOT_PATH . "js/tinymce/langs/" . $lang . ".js")) ? "language: '" . $lang . "'," : ""), $html);
        if($config->get('doautosave')){
            $html = str_replace("{TINYMCE_AUTOSAVEOPTIONS}", "autosave_interval: \"" 
                . $config->get('autosaveinterval') . "s\",autosave_restore_when_empty: " 
                . (!! ($config->get('tryrestoreempty')) ? 'true':'false') 
                . ",autosave_retention: \"" . $config->get('autosaveretention') . "m\",", $html);
        } else {
            $html = str_replace("{TINYMCE_AUTOSAVEOPTIONS}", "", $html);
        }
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
