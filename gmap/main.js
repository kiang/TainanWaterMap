/*
 * 流域編號=1580(八掌溪流域)、1590(急水溪流域)、1600(將軍溪流域)、1630(曾文溪流域)、1650(鹽水溪流域)、1660(二仁溪流域)
 */
var map, info, bounds, points, markers = [], markersBase = [];
var rivers = ['1580', '1590', '1600', '1630', '1650', '1660'];
function initialize() {
    map = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 12,
        center: {lat: 22.672925, lng: 120.309465}
    });
    map.data.loadGeoJson('../areas.json');
    map.data.loadGeoJson('../lines.json');
    map.data.setStyle({
      fillColor: 'blue',
      strokeColor: 'blue',
      strokeWeight: 1
    });
    map.data.addListener('click', function(event) {
      var infoText = '';
      event.feature.forEachProperty(function(v, k) {
        if(k.indexOf('_NAME') !== -1) {
          infoText += k + ': ' + v + '<br />';
        }
      });
      info.setContent(infoText);
      info.setPosition(event.latLng);
      info.open(map);
      infoText = '';
      event.feature.forEachProperty(function(v, k) {
        infoText += k + ': ' + v + '<br />';
      });
      $('#pointContent').html(infoText);
    });
    info = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();

    $.getJSON('../points.json', {}, function (r) {
        points = r;
        for (k in points) {
            if (k.substr(0, 1) === 'V') {
                var geoPoint = (new google.maps.LatLng(points[k].latitude, points[k].longitude));

                var marker = new google.maps.Marker({
                    position: geoPoint,
                    map: map,
                    icon: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
                    title: points[k].name
                });

                marker.data = points[k];
                marker.addListener('click', function () {
                    var infoText = '<strong>' + this.data.name + '</strong>';
                    infoText += '<br />站碼: ' + this.data.code;
                    infoText += '<br />河川分區: ' + this.data.type;
                    info.setContent(infoText);
                    info.open(map, this);
                    infoText += '<br />行政區: ' + this.data.area;
                    infoText += '<br />轄管單位: ' + this.data.admin;
                    infoText += '<br />河川排水: ' + this.data.river;
                    infoText += '<br /><img src="' + this.data.image + '" />';

                    map.setZoom(15);
                    map.setCenter(this.getPosition());
                    $('#pointContent').html(infoText);
                });
                markers.push(marker);
                markersBase.push(marker);
                bounds.extend(geoPoint);
            }
        }
        for (k in rivers) {
          //http://210.61.23.112/tainanwatermobile/TainanLocalWst/GetLocalWstWarnInfo.aspx?basin=
            $.getJSON('../json/' + rivers[k] + '.json', {}, function (i) {
                for (g in i.local_wst_warn_info) {
                    var key = i.local_wst_warn_info[g].st_no;
                    if (!points[key]) {
                        console.log(key);
                        continue;
                    }
                    points[key].alert_level = i.local_wst_warn_info[g].alert_level;
                    points[key].change = i.local_wst_warn_info[g].change;
                    points[key].date = i.local_wst_warn_info[g].date;
                    points[key].info = i.local_wst_warn_info[g].info;
                    points[key].warn_info = i.local_wst_warn_info[g].warn_info;
                    var geoPoint = (new google.maps.LatLng(points[key].latitude, points[key].longitude));

                    if ('未達警戒' === points[key].alert_level) {
                        var marker = new google.maps.Marker({
                            position: geoPoint,
                            map: map,
                            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                            title: points[key].name
                        });
                    } else {
                        var marker = new google.maps.Marker({
                            position: geoPoint,
                            map: map,
                            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                            title: points[key].name
                        });
                    }


                    marker.data = points[key];
                    marker.addListener('click', function () {
                        var infoText = '<strong>' + this.data.name + '</strong>';
                        infoText += '<br />站碼: ' + this.data.code;
                        infoText += '<br />河川分區: ' + this.data.type;
                        info.setContent(infoText);
                        info.open(map, this);

                        infoText += '<br />行政區: ' + this.data.area;
                        infoText += '<br />轄管單位: ' + this.data.admin;
                        infoText += '<br />河川排水: ' + this.data.river;
                        infoText += '<br />警戒狀態: ' + this.data.alert_level;
                        infoText += '<br />說明: ' + this.data.warn_info;
                        infoText += '<br />時間: ' + this.data.date;
                        if (this.data.image !== '') {
                            infoText += '<br /><img src="' + this.data.image + '" />';
                        }

                        map.setZoom(15);
                        map.setCenter(this.getPosition());
                        $('#pointContent').html(infoText);
                    });
                    markers.push(marker);
                    markersBase.push(marker);
                    bounds.extend(geoPoint);
                }
            });
        }
        setTimeout(function () {
            map.fitBounds(bounds);
        }, 2000);
    });

    $('a.bounds-reset').click(function () {
        map.fitBounds(bounds);
        showPoints();
        return false;
    });

    $('a.bounds-image').click(function () {
        map.fitBounds(bounds);
        showImagePoints();
        return false;
    });

    $('a.bounds-alert').click(function () {
        map.fitBounds(bounds);
        showAlertPoints();
        return false;
    });

}

function showPoints() {
    for (k in markers) {
        markers[k].setMap(null);
    }
    markers = [];
    for (k in markersBase) {
        markersBase[k].setMap(map);
        markers.push(markersBase[k]);
    }
}

function showImagePoints() {
    for (k in markers) {
        markers[k].setMap(null);
    }
    markers = [];
    for (k in markersBase) {
        if (markersBase[k].data.image != '') {
            markersBase[k].setMap(map);
            markers.push(markersBase[k]);
        }
    }
}

function showAlertPoints() {
    for (k in markers) {
        markers[k].setMap(null);
    }
    markers = [];
    for (k in markersBase) {
        if (markersBase[k].data.alert_level && markersBase[k].data.alert_level !== '未達警戒') {
            markersBase[k].setMap(map);
            markers.push(markersBase[k]);
        }
    }
}

google.maps.event.addDomListener(window, 'load', initialize);
