// This will be called by the admin adapter when the settings page loads
function load(settings, onChange) {
    if (!settings) return;

    $('.value').each(function () {
        const $key = $(this);
        const id = $key.attr('id');
        const setting = $key.data('setting') || id;

        if ($key.attr('type') === 'checkbox') {
            $key.prop('checked', settings[setting])
                .on('change', () => onChange());
        } else {
            $key.val(settings[setting])
                .on('change', () => onChange())
                .on('keyup', () => onChange());
        }
    });

    onChange(false);
    if (M) M.updateTextFields();
}

// This will be called by the admin adapter when the user presses the save button
function save(callback) {
    const obj = {};

    $('.value').each(function () {
        const $this = $(this);
        const setting = $this.data('setting') || $this.attr('id');

        if ($this.attr('type') === 'checkbox') {
            obj[setting] = $this.prop('checked');
        } else {
            obj[setting] = $this.val();
        }
    });

    callback(obj);
}
