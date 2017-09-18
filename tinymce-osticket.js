if (typeof RedactorPlugins === 'undefined') var RedactorPlugins = {};

/* Generic draft support for osTicket. The plugins supports draft retrieval
 * automatically, along with draft autosave, and image uploading.
 *
 * Configuration:
 * draftNamespace: namespace for the draft retrieval
 * draftObjectId: extension to the namespace for draft retrieval
 *
 * Caveats:
 * Login (staff only currently) is required server-side for drafts and image
 * uploads. Furthermore, the id of the staff is considered for the drafts,
 * so one user will not retrieve drafts for another user.
 */
 
RedactorPlugins.draft = function() {
  return {
    init: function() {
        if (!this.opts.draftNamespace)
            return;

        this.opts.changeCallback = this.draft.hideDraftSaved;
        var autosave_url = 'ajax.php/draft/' + this.opts.draftNamespace;
        if (this.opts.draftObjectId)
            autosave_url += '.' + this.opts.draftObjectId;
        this.opts.autosave = this.opts.autoCreateUrl = autosave_url;
        this.opts.autosaveInterval = 30;
        this.opts.autosaveCallback = this.draft.afterUpdateDraft;
        this.opts.autosaveErrorCallback = this.draft.autosaveFailed;
        this.opts.imageUploadErrorCallback = this.draft.displayError;
        if (this.opts.draftId) {
            this.opts.autosave = 'ajax.php/draft/'+this.opts.draftId;
            this.opts.clipboardUploadUrl =
            this.opts.imageUpload =
                'ajax.php/draft/'+this.opts.draftId+'/attach';
        }
        else if (this.$textarea.hasClass('draft')) {
            // Just upload the file. A draft will be created automatically
            // and will be configured locally in the afterUpateDraft()
            this.opts.clipboardUploadUrl =
            this.opts.imageUpload = this.opts.autoCreateUrl + '/attach';
            this.opts.imageUploadCallback = this.afterUpdateDraft;
        }

        // FIXME: Monkey patch Redactor's autosave enable method to disable first
        var oldAse = this.autosave.enable;
        this.autosave.enable = function() {
            this.autosave.disable();
            oldAse.call(this);
        }.bind(this);

        if (autosave_url)
            this.autosave.enable();

        if (this.$textarea.hasClass('draft')) {
            this.$draft_saved = $('<span>')
                .addClass("pull-right draft-saved")
                .hide()
                .append($('<span>')
                    .text(__('Draft Saved')));
            // Float the [Draft Saved] box with the toolbar
            this.$toolbar.append(this.$draft_saved);

            // Add [Delete Draft] button to the toolbar
            if (this.opts.draftDelete) {
                var trash = this.draft.deleteButton =
                    this.button.add('deleteDraft', __('Delete Draft'))
                this.button.addCallback(trash, this.draft.deleteDraft);
                this.button.setAwesome('deleteDraft', 'icon-trash');
                trash.parent().addClass('pull-right');
                trash.addClass('delete-draft');
                if (!this.opts.draftId)
                    trash.hide();
            }
        }
        if (this.code.get())
            this.$box.trigger('draft:recovered');
    },
    afterUpdateDraft: function(name, data) {
        // If the draft was created, a draft_id will be sent back — update
        // the URL to send updates in the future
        if (!this.opts.draftId && data.draft_id) {
            this.opts.draftId = data.draft_id;
            this.opts.autosave = 'ajax.php/draft/' + data.draft_id;
            this.opts.clipboardUploadUrl =
            this.opts.imageUpload =
                'ajax.php/draft/'+this.opts.draftId+'/attach';
            if (!this.code.get())
                this.code.set(' ', false);
        }
        // Only show the [Draft Saved] notice if there is content in the
        // field that has been touched
        if (!this.draft.firstSave) {
            this.draft.firstSave = true;
            // No change yet — dont't show the button
            return;
        }
        if (data && this.code.get()) {
            this.$draft_saved.show().delay(5000).fadeOut();
        }
        // Show the button if there is a draft to delete
        if (this.opts.draftId && this.opts.draftDelete)
            this.draft.deleteButton.show();
        this.$box.trigger('draft:saved');
    },
    autosaveFailed: function(error) {
        if (error.code == 422)
            // Unprocessable request (Empty message)
            return;

        this.draft.displayError(error);
        // Cancel autosave
        this.autosave.disable();
        this.hideDraftSaved();
        this.$box.trigger('draft:failed');
    },

    displayError: function(json) {
        $.sysAlert(json.error,
            __('Unable to save draft.')
          + __('Refresh the current page to restore and continue your draft.'));
    },

    hideDraftSaved: function() {
        this.$draft_saved.hide();
    },

    deleteDraft: function() {
        if (!this.opts.draftId)
            // Nothing to delete
            return;
        var self = this;
        $.ajax('ajax.php/draft/'+this.opts.draftId, {
            type: 'delete',
            async: false,
            success: function() {
                self.draft_id = self.opts.draftId = undefined;
                self.draft.hideDraftSaved();
                self.code.set(self.opts.draftOriginal || '', false, false);
                self.opts.autosave = self.opts.autoCreateUrl;
                self.draft.deleteButton.hide();
                self.draft.firstSave = false;
                self.$box.trigger('draft:deleted');
            }
        });
    }
  };
};

RedactorPlugins.autolock = function() {
  return {
    init: function() {
      var code = this.$box.closest('form').find('[name=lockCode]'),
          self = this;
      if (code.length)
        this.opts.keydownCallback = function(e) {
          self.$box.closest('[data-lock-object-id]').exclusive('acquire');
        };
    }
  };
}

RedactorPlugins.signature = function() {
  return {
    init: function() {
        var $el = $(this.$element.get(0)),
            inner = $('<div class="inner"></div>');
        if ($el.data('signatureField')) {
            this.$signatureBox = $('<div class="selected-signature"></div>')
                .append(inner)
                .appendTo(this.$box);
            if ($el.data('signature'))
                inner.html($el.data('signature'));
            else
                this.$signatureBox.hide();
            $('input[name='+$el.data('signatureField')+']', $el.closest('form'))
                .on('change', false, false, $.proxy(this.signature.updateSignature, this));
            if ($el.data('deptField'))
                $(':input[name='+$el.data('deptField')+']', $el.closest('form'))
                    .on('change', false, false, $.proxy(this.signature.updateSignature, this));
            // Expand on hover
            var outer = this.$signatureBox,
                inner = $('.inner', this.$signatureBox).get(0),
                originalHeight = outer.height(),
                hoverTimeout = undefined,
                originalShadow = this.$signatureBox.css('box-shadow');
            this.$signatureBox.hover(function() {
                hoverTimeout = setTimeout($.proxy(function() {
                    originalHeight = Math.max(originalHeight, outer.height());
                    $(this).animate({
                        'height': inner.offsetHeight
                    }, 'fast');
                    $(this).css('box-shadow', 'none', 'important');
                }, this), 250);
            }, function() {
                clearTimeout(hoverTimeout);
                $(this).stop().animate({
                    'height': Math.min(inner.offsetHeight, originalHeight)
                }, 'fast');
                $(this).css('box-shadow', originalShadow);
            });
            this.$box.find('.redactor_editor').css('border-bottom-style', 'none', true);
        }
    },
    updateSignature: function(e) {
        var $el = $(this.$element.get(0));
            selected = $(':input:checked[name='+$el.data('signatureField')+']', $el.closest('form')).val(),
            type = $(e.target).val(),
            dept = $(':input[name='+$el.data('deptField')+']', $el.closest('form')).val(),
            url = 'ajax.php/content/signature/',
            inner = $('.inner', this.$signatureBox);
        e.preventDefault && e.preventDefault();
        if (selected == 'dept' && $el.data('deptId'))
            url += 'dept/' + $el.data('deptId');
        else if (selected == 'dept' && $el.data('deptField')) {
            if (dept)
                url += 'dept/' + dept;
            else
                return inner.empty().parent().hide();
        }
        else if (selected == 'theirs' && $el.data('posterId')) {
            url += 'agent/' + $el.data('posterId');
        }
        else if (type == 'none')
           return inner.empty().parent().hide();
        else
            url += selected;

        inner.load(url).parent().show();
    }
  }
};

//Start typeahead

watchtypeahead = function(e, sender) {
	var current = sender.selection.getContent(),
		allText = sender.selection.getRng().endContainer.data,
		offset = sender.selection.getRng().endOffset,
		lhs = allText.substring(0, offset),
		search = new RegExp(/%\{([^}]*)$/),
		match;

	if (!lhs) {
		return !e.isDefaultPrevented();
	}

	if (e.which == 27 || !(match = search.exec(lhs)))
		// No longer in a element — close typeahead
		return destroytypeahead();

	if (e.type == 'click')
		return;

	// Locate the position of the cursor and the number of characters back
	// to the `%{` symbols
	var sel         = this.selection.get(),
		range       = this.sel.getRangeAt(0),
		content     = current.textContent,
		clientRects = range.getClientRects(),
		position    = clientRects[0],
		backText    = match[1],
		parent      = this.selection.getParent() || this.$editor,
		plugin      = this.contexttypeahead;

	// Insert a hidden text input to receive the typed text and add a
	// typeahead widget
	if (!this.contexttypeahead.typeahead) {
		this.contexttypeahead.typeahead = $('<input type="text">')
			.css({position: 'absolute', visibility: 'hidden'})
			.width(0).height(position.height - 4)
			.appendTo(document.body)
			.typeahead({
				property: 'variable',
				minLength: 0,
				arrow: $('<span class="pull-right"><i class="icon-muted icon-chevron-right"></i></span>')
					.css('padding', '0 0 0 6px'),
				highlighter: function(variable, item) {
					var base = $.fn.typeahead.Constructor.prototype.highlighter
						.call(this, variable),
						further = new RegExp(variable + '\\.'),
						extendable = Object.keys(plugin.variables).some(function(v) {
						return v.match(further);
						}),
						arrow = extendable ? this.options.arrow.clone() : '';

					return $('<div/>').html(base).prepend(arrow).html()
						+ $('<span class="faded">')
						.text(' — ' + item.desc)
						.wrap('<div>').parent().html();
				},
				item: '<li><a href="#" style="display:block"></a></li>',
				source: this.contexttypeahead.getContext.bind(this),
				sorter: function(items) {
					items.sort(
						function(a,b) {return a.variable > b.variable ? 1 : -1;}
					);
					return items;
				},
				matcher: function(item) {
					if (item.toLowerCase().indexOf(this.query.toLowerCase()) !== 0)
						return false;

					return (this.query.match(/\./g) || []).length == (item.match(/\./g) || []).length;
				},
				onselect: this.contexttypeahead.select.bind(this),
				scroll: true,
				items: 100
			});
	}

	if (position) {
		var width = plugin.textWidth(
			backText,
			this.selection.getParent() || $('<div class="redactor-editor">')
		),
		pleft = $(parent).offset().left,
		left = position.left - width;

		if (left < pleft)
			// This is a bug in chrome, but I'm not sure how to adjust it
			left += pleft;

		plugin.typeahead
		.css({top: position.top + $(window).scrollTop(), left: left});
	}

	plugin.typeahead
		.val(match[1])
		.trigger(e);

	return !e.isDefaultPrevented();
}

getContexttypeahead = function(typeahead, query) {
	var dfd, that=this.contexttypeahead,
		root = this.$element.data('rootContext');
	if (!this.contexttypeahead.context) {
		dfd = $.Deferred();
		$.ajax('ajax.php/content/context', {
			data: {root: root},
			success: function(json) {
				var items = $.map(json, function(v,k) {
					return {variable: k, desc: v};
				});
				that.variables = json;
				dfd.resolve(items);
			}
		});
		this.contexttypeahead.context = dfd;
	}
	// Only fetch the context once for this redactor box
	this.contexttypeahead.context.then(function(items) {
	typeahead.process(items);
	});
};

textWidthtypeahead = function(text, clone) {
	var c = $(clone),
		o = c.clone().text(text)
			.css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden'})
			.css({'font-family': c.css('font-family'), 'font-weight': c.css('font-weight'),
			'font-size': c.css('font-size')})
			.appendTo($('body')),
		w = o.width();

	o.remove();

	return w;
};

destroytypeahead = function() {
	if (this.contexttypeahead.typeahead) {
		this.contexttypeahead.typeahead.typeahead('hide');
		this.contexttypeahead.typeahead.remove();
		this.contexttypeahead.typeahead = false;
	}
};

selecttypeahead = function(item, event) {
	// Collapse multiple textNodes together
	(this.selection.getBlock() || this.$editor.get(0)).normalize();
	var current = this.selection.getCurrent(),
		sel     = this.selection.get(),
		range   = this.sel.getRangeAt(0),
		cursorAt = range.endOffset,
		// TODO: Consume immediately following `}` symbols
		plugin  = this.contexttypeahead,
		search  = new RegExp(/%\{([^}]*)(\}?)$/);

	// FIXME: ENTER will end up here, but current will be empty

	if (!current)
		return;

	// Set cursor at the end of the expanded text
	var left = current.textContent.substring(0, cursorAt),
		right = current.textContent.substring(cursorAt),
		autoExpand = event.target.nodeName == 'I',
		selected = item.variable + (autoExpand ? '.' : '')
		newLeft = left.replace(search, '%{' + selected + '}');

	current.textContent = newLeft
		// Drop the remaining part of a variable block, if any
		+ right.replace(/[^%}]*?[%}]/, '');

	this.range.setStart(current, newLeft.length - 1);
	this.range.setEnd(current, newLeft.length - 1);
	this.selection.addRange();
	if (!autoExpand)
		return plugin.destroy();

	plugin.typeahead.val(selected);
	plugin.typeahead.typeahead('lookup');
	return false;
};
	
//End typeahead

/* Redactor richtext init */
$(function() {
    var captureImageSizes = function(html) {
        $('img', this.$box).each(function(i, img) {
            // TODO: Rewrite the entire <img> tag. Otherwise the @width
            // and @height attributes will begin to accumulate
            before = img.outerHTML;
            if (img.clientWidth && img.clientHeight)
                $(img).attr('width', img.clientWidth)
                      .attr('height',img.clientHeight);
            html = html.replace(before, img.outerHTML);
        });
        return html;
    },
    redact = $.redact = function(el, options) {
        tinymce.init({
            target: el,
            height: {TINYMCE_HEIGHT},
            width: '100%',
            theme: '{TINYMCE_THEME}',
            menubar: {TINYMCE_MENUBAR},
            branding: {TINYMCE_POWERED_BY},
            plugins: '{TINYMCE_PLUGINS}',
            toolbar: '{TINYMCE_TOOLBAR}',
            {TINYMCE_AUTOSAVEOPTIONS},
			init_instance_callback: function(editor){
				editor.on('click', function(e){
					watchtypeahead(e, this);
				});
				editor.on('keyup', function(e){
					watchtypeahead(e, this);
				});
				editor.on('keydown', function(e){
					watchtypeahead(e, this);
				});
			}
        });
    },
    findRichtextBoxes = function() {
        $('.richtext').each(function(i,el) {
            if ($(el).hasClass('ifhtml'))
                // Check if html_thread is enabled first
                getConfig().then(function(c) {
                    if (c.html_thread)
                        redact(el);
                });
            else
                // Make a rich text editor immediately
                redact(el);
        });
    },
    cleanupRedactorElements = function() {
        // Tear down redactor editors on this page
        $('.richtext').each(function() {
            var redactor = $(this).data('redactor');
            if (redactor)
                redactor.core.destroy();
        });
    };
    findRichtextBoxes();
    $(document).ajaxStop(findRichtextBoxes);
    $(document).on('pjax:success', findRichtextBoxes);
    $(document).on('pjax:start', cleanupRedactorElements);
});

$(document).on('focusout.redactor', 'div.redactor_richtext', function (e) {
    $(this).siblings('textarea').trigger('change');
});

$(document).ajaxError(function(event, request, settings) {
    if (settings.url.indexOf('ajax.php/draft') != -1
            && settings.type.toUpperCase() == 'POST') {
        $('.richtext').each(function() {
            var redactor = $(this).data('redactor');
            if (redactor) {
                redactor.autosave.disable();
                clearInterval(redactor.autosaveInterval);
            }
        });
        $.sysAlert(__('Unable to save draft.'),
            __('Refresh the current page to restore and continue your draft.'));
    }
});
$('form select#cannedResp').change(function() {
	var fObj = $(this).closest('form');
	var cid = $(this).val();
	var tid = $(':input[name=id]',fObj).val();
	$(this).find('option:first').attr('selected', 'selected').parent('select');

	var $url = 'ajax.php/kb/canned-response/'+cid+'.json';
	if (tid)
		$url =  'ajax.php/tickets/'+tid+'/canned-resp/'+cid+'.json';

	$.ajax({
			type: "GET",
			url: $url,
			dataType: 'json',
			cache: false,
			success: function(canned){
				//Canned response.
				var box = $('#response',fObj),
					redactor = box.data('redactor');
				if(canned.response) {
					if (redactor)
						redactor.insert.html(canned.response);
					else
						box.val(box.val() + canned.response);

					if (redactor)
						redactor.observe.load();
				}
				//Canned attachments.
				var ca = $('.attachments', fObj);
				if(canned.files && ca.length) {
					var fdb = ca.find('.dropzone').data('dropbox');
					$.each(canned.files,function(i, j) {
					  fdb.addNode(j);
					});
				}
			}
		})
		.done(function() { })
		.fail(function() { });
});