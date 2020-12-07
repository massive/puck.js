// https://devzone.nordicsemi.com/cfs-file/__key/communityserver-discussions-components-files/4/pastedimage1552891009042v6.png

export var report = new Uint8Array([
    0x05, 0x0c,                    // USAGE_PAGE (Consumer Devices)
    0x09, 0x01,                    // USAGE (Consumer Control)
    0xa1, 0x01,                    // COLLECTION (Application)
                                   // -------------------- common global items
    0x05, 0x0b,
    0x09, 0x01,
    0xa1, 0x01,
    0x85, 0x03,
    0x15, 0x00,
    0x25, 0x01,
    0x75, 0x01,
    0x95, 0x01,

    0x09, 0x2f,                    //   Phone mute
    0x81, 0x06,                    //   INPUT
    0xc0                           // END_COLLECTION
  ]);
  
  function p(c,cb) { NRF.sendHIDReport(c, function() { NRF.sendHIDReport(0, cb) }); }
  export var mute = function(cb) { p(0x1,cb) };
