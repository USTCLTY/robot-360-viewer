
threeSixty = {
    init: function () {
        this._vr = new AC.VR('viewer', 'images/Frame######.png', [180, 1], {
            invert: false,
            initialPos: [0, 0],
            introSpins: 0.5,
            introDuration: 1.2,
            fps: 30,
            grabRotateDistance: 800
        });
    },
    didShow: function() {
        this.init();
    },
    willHide: function() {
        recycleObjectValueForKey(this, "_vr");
    },
    shouldCache: function() {
        return false;
    }
}
if (!window.isLoaded) {
    window.addEventListener("load", function() {
        threeSixty.init();
    }, false);
}
