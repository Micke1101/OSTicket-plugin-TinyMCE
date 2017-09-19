<?php
require_once INCLUDE_DIR . 'class.plugin.php';

class TinyMCEPluginConfig extends PluginConfig
{

    // Provide compatibility function for versions of osTicket prior to
    // translation support (v1.9.4)
    function translate()
    {
        if (! method_exists('Plugin', 'translate')) {
            return array(
                function ($x) {
                    return $x;
                },
                function ($x, $y, $n) {
                    return $n != 1 ? $y : $x;
                }
            );
        }
        return Plugin::translate('tinymce');
    }

    /**
     * Build an Admin settings page.
     *
     * {@inheritdoc}
     *
     * @see PluginConfig::getOptions()
     */
    function getOptions()
    {
        list ($__, $_N) = self::translate();
        return array(
            'mainoptions' => new SectionBreakField([
                'label' => $__('Main options'),
                'hint' => $__('Mainly visual settings.'),
                'default' => TRUE
            ]),
            'plugins' => new ChoiceField([
                'label' => $__('Plugins'),
                'required' => false,
                'hint' => $__('What plugins do you want to load.'),
                'default' => '',
                'configuration'=>array('multiselect'=>true,'prompt'=>__('Plugins')),
                'choices' => array(
                    'advlist' => __('Advanced list'),
                    'autolink' => __('Autolink'),
                    'lists' => __('Normalize lists'),
                    'link' => __('Links'),
                    'image' => __('Images'),
                    'charmap' => __('Unicode characters'),
                    'print' => __('Print'),
                    'preview' => __('Preview'),
                    'anchor' => __('Anchor'),
                    'textcolor' => __('Text color'),
                    'searchreplace' => __('Search and Replace'),
                    'visualblocks' => __('Visual Blocks'),
                    'code' => __('Edit HTML'),
                    'fullscreen' => __('Fullscreen'),
                    'insertdatetime' => __('Date and time'),
                    'media' => __('HTML5 Media'),
                    'table' => __('Table'),
                    'contextmenu' => __('Context menu'),
                    'paste' => __('Filter office content'),
                    'help' => __('Help'),
                )
            ]),
            'toolbar' => new TextboxField([
                'label' => $__('Toolbar'),
                'required' => false,
                'configuration'=>array('size'=>50,'length'=>1024),
                'hint' => sprintf($__('How do you want your toolbar to look like, %s'), '<a href="https://www.tinymce.com/docs/configure/editor-appearance/#toolbar">TinyMCE</a>'),
                'default' => 'insert | undo redo |  styleselect | bold italic backcolor  | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help'
            ]),
            'theme' => new ChoiceField([
                'label' => $__('Theme'),
                'required' => true,
                'hint' => $__('What theme do you want to use.'),
                'default' => 'modern',
                'choices' => array(
                    'modern' => __('Modern'),
                )
            ]),
            'menubar' => new BooleanField([
                'label' => $__('Show menubar'),
                'required' => false,
                'hint' => $__('Display the menubar or not.'),
                'default' => true
            ]),
            'poweredby' => new BooleanField([
                'label' => $__('Show powered by message'),
                'required' => false,
                'hint' => $__('Display the powered by message or not.'),
                'default' => true
            ]),
            'height' => new TextboxField([
                'label' => $__('Height'),
                'required' => true,
                'size'=>16,
                'validator' => 'number',
                'hint' => $__('The default height of TinyMCE'),
                'default' => 250
            ]),
            'jsfile' => new ChoiceField([
                'label' => $__('TinyMCE source'),
                'required' => true,
                'hint' => $__('Where do you want to load TinyMCE from.'),
                'default' => 'js',
                'choices' => array(
                    'js' => sprintf(__('Javascript folder (%s)'), 'js/tinymce'),
                    'plugin' => __('Plugin folder'),
                    'cloud' => __('Cloud hosted'),
                )
            ]),
            'apikey' => new TextboxField([
                'label' => $__('TinyMCE API Key'),
                'required' => false,
                'size'=>16,
                'hint' => sprintf($__('If you\'re using cloud hosted TinyMCE you may require an API key.<br/>%sSign up for a API key%s'), '<a href="https://store.ephox.com/signup/">', '</a>'),
                'default' => ''
            ]),
            'autosaveoptions' => new SectionBreakField([
                'label' => $__('Autosave options'),
                'hint' => $__('The options regarding autosaving/drafts.'),
                'default' => TRUE
            ]),
            'doautosave' => new BooleanField([
                'label' => $__('Enable autosaving'),
                'required' => false,
                'hint' => $__('TinyMCE will create drafts automaticly.'),
                'default' => true
            ]),
            'autosaveinterval' => new TextboxField([
                'label' => $__('Autosave frequency'),
                'required' => false,
                'size'=>16,
                'validator' => 'number',
                'hint' => $__('How long between each save in seconds.'),
                'default' => '30'
            ]),
            'tryrestoreempty' => new BooleanField([
                'label' => $__('Restore when empty'),
                'required' => false,
                'hint' => $__('If the user has a draft available restore it automaticly.'),
                'default' => true
            ]),
            'autosaveretention' => new TextboxField([
                'label' => $__('Draft lifespan'),
                'required' => false,
                'size'=>16,
                'validator' => 'number',
                'hint' => $__('How long should a draft be stored for in minutes.'),
                'default' => '30'
            ]),
        );
    }
}
