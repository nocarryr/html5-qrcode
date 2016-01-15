(function($) {
    var overlayStyle = {
      'position': 'absolute',
      'background-color': 'transparent',
      'border-style': 'solid',
      'border-color': 'rgba(0, 0, 0, 0.5)',
      'z-index': '20',
    };
    jQuery.fn.extend({
        html5_qrcode: function(qrcodeSuccess, qrcodeError, videoError) {
            return this.each(function() {
                var currentElem = $(this);

                var height = currentElem.height();
                var width = currentElem.width();

                if (height == null) {
                    height = 250;
                }

                if (width == null) {
                    width = 300;
                }

                var canvasCrop = currentElem.data('canvasCrop')
                if (typeof(canvasCrop) == 'undefined'){
                    canvasCrop = 1.0;
                }

                var canvasCoords = {
                    dx: 0,
                    dy: 0,
                    w: width * canvasCrop,
                    h: height * canvasCrop,
                };
                canvasCoords.sx = (width - canvasCoords.w) / 2;
                canvasCoords.sy = (height - canvasCoords.h) / 2;

                overlayStyle.left = canvasCoords.sx + currentElem.offset().left;
                overlayStyle.top = canvasCoords.sy + currentElem.offset().top;
                overlayStyle.width = canvasCoords.w;
                overlayStyle.height = canvasCoords.h;

                var vidElem = $('<video autoplay></video>')
                        .attr('width', width)
                        .attr('height', height)
                        .appendTo(currentElem);
                var canvasElem = $('<canvas id="qr-canvas"></canvas>')
                        .attr('width', canvasCoords.dWidth)
                        .attr('height', canvasCoords.dHeight)
                        .hide()
                        .appendTo(currentElem);
                var overlayElem = null;
                if (canvasCrop !== 1.0){
                    overlayElem = $('<div class="qr-overlay"></div>')
                        .css(overlayStyle)
                        .appendTo(currentElem.offsetParent());
                }

                var video = vidElem[0];
                var canvas = canvasElem[0];
                var context = canvas.getContext('2d');
                var localMediaStream;

                var scan = function() {

                    if (localMediaStream) {
                        context.drawImage(video, canvasCoords.sx, canvasCoords.sy,
                            canvasCoords.w, canvasCoords.h,
                            canvasCoords.dx, canvasCoords.dy,
                            canvasCoords.w, canvasCoords.h);

                        try {
                            qrcode.decode();
                        } catch (e) {
                            qrcodeError(e, localMediaStream);
                        }

                        $.data(currentElem[0], "timeout", setTimeout(scan, 500));

                    } else {
                        $.data(currentElem[0], "timeout", setTimeout(scan, 500));
                    }
                };//end snapshot function

                window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
                navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

                var successCallback = function(stream) {
                    video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
                    localMediaStream = stream;
                    $.data(currentElem[0], "stream", stream);
                    $.data(currentElem[0], "timeout", setTimeout(scan, 1000));
                };

                // Call the getUserMedia method with our callback functions
                if (navigator.getUserMedia) {
                    if (MediaStreamTrack === undefined || MediaStreamTrack.getSources === undefined) {
                      var mediaConstraints = {video: true};
                      navigator.getUserMedia(mediaConstraints, successCallback, function(error) {
                          videoError(error, localMediaStream);
                      });
                      return;
                    }

                    MediaStreamTrack.getSources(function(sources) {
                      var rearCameras = sources.filter(function(source) {
                        return source.facing === 'environment';
                      });

                      if (rearCameras.length === 0) {
                        var mediaConstraints = {video: true};
                        navigator.getUserMedia(mediaConstraints, successCallback, function(error) {
                            videoError(error, localMediaStream);
                        });
                        return;
                      }

                      var mediaConstraints = {video: {optional: [
                        {sourceId: rearCameras[0].id}
                      ]}};
                      navigator.getUserMedia(mediaConstraints, successCallback, function(error) {
                          videoError(error, localMediaStream);
                      });
                    });
                } else {
                    console.log('Native web camera streaming (getUserMedia) not supported in this browser.');
                    // Display a friendly "sorry" message to the user
                }

                qrcode.callback = function (result) {
                    qrcodeSuccess(result, localMediaStream);
                };
            }); // end of html5_qrcode
        },
        html5_qrcode_stop: function() {
            return this.each(function() {
                //stop the stream and cancel timeouts
                $(this).data('stream').getVideoTracks().forEach(function(videoTrack) {
                    videoTrack.stop();
                });

                clearTimeout($(this).data('timeout'));
            });
        }
    });
})(jQuery);
