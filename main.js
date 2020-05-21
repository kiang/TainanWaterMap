var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });

var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(20);
var matrixIds = new Array(20);
for (var z = 0; z < 20; ++z) {
    // generate resolutions and matrixIds arrays for this WMTS
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = z;
}
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
var rivers = ['1580', '1590', '1600', '1630', '1650', '1660'];

closer.onclick = function() {
  popup.setPosition(undefined);
  closer.blur();
  return false;
};

var popup = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
});

var nlscMatrixIds = new Array(21);
for (var i=0; i<21; ++i) {
  nlscMatrixIds[i] = i;
}

var styleLines = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(86,113,228,0.7)',
      width: 3
  })
});

var styleAreas = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(86,113,228,0.7)',
      width: 3
  }),
  fill: new ol.style.Fill({
      color: 'rgba(86,113,228,0.3)',
  })
});

var styleWalk = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(82,184,48,0.7)',
      width: 8
  }),
  image: new ol.style.Circle({
    radius: 10,
    fill: new ol.style.Fill({
      color: 'rgba(82,184,48,0.7)',
    })
  }),
});

var vectorLines = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'lines.json',
    format: new ol.format.GeoJSON()
  }),
  style: styleLines
});

var vectorAreas = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'areas.json',
    format: new ol.format.GeoJSON()
  }),
  style:styleAreas
});

var vectorWalk = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'walk.json',
    format: new ol.format.GeoJSON()
  }),
  style:styleWalk
});

var baseLayer = new ol.layer.Tile({
    source: new ol.source.WMTS({
        matrixSet: 'EPSG:3857',
        format: 'image/png',
        url: 'https://wmts.nlsc.gov.tw/wmts',
        layer: 'EMAP',
        tileGrid: new ol.tilegrid.WMTS({
            origin: ol.extent.getTopLeft(projectionExtent),
            resolutions: resolutions,
            matrixIds: matrixIds
        }),
        style: 'default',
        wrapX: true,
        attributions: '<a href="https://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>'
    }),
    opacity: 0.5
});

var targetLayer;
var pointStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 10,
    fill: new ol.style.Fill({
      color: [249, 157, 34, 0.7]
    })
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    fill: new ol.style.Fill({
      color: [215, 48, 39, 0.7]
    })
  })
});
var pointRedStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 10,
    fill: new ol.style.Fill({
      color: [243, 0, 80, 0.7]
    })
  })
});
var pointGreenStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 10,
    fill: new ol.style.Fill({
      color: [0, 243, 80, 0.7]
    })
  })
});

var points;
$.get('points.json', function(jPoints) {
  points = jPoints;
  var fc = [];
  for(k in points) {
    if (k.substr(0, 1) !== 'V') {
      continue;
    }
    var p = points[k];
    p.fType = 'img';
    p.geometry = new ol.geom.Point(ol.proj.fromLonLat([p.longitude, p.latitude]));
    var f = new ol.Feature(p);
    fc.push(f);
  }
  targetLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
      features: fc
    }),
    style: function(f) {
      var fStyle = pointStyle.clone();
      fStyle.getText().setText(f.get('name'));
      return fStyle;
    },
    map: map
  });
})

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.20345985889435, 22.994906062625773]),
  zoom: 14
});

var map = new ol.Map({
  layers: [baseLayer, vectorLines, vectorAreas],
  overlays: [popup],
  target: 'map',
  view: appView
});

map.addControl(sidebar);

var geolocation = new ol.Geolocation({
  projection: appView.getProjection()
});

geolocation.setTracking(true);

geolocation.on('error', function(error) {
        console.log(error.message);
      });

var positionFeature = new ol.Feature();

positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

var geolocationCentered = false;
geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  if(coordinates) {
    positionFeature.setGeometry(new ol.geom.Point(coordinates));
    if(false === geolocationCentered) {
      map.getView().setCenter(coordinates);
      geolocationCentered = true;
    }
  }
});

new ol.layer.Vector({
  map: map,
  source: new ol.source.Vector({
    features: [positionFeature]
  })
});

map.on('singleclick', function(evt) {
  map.getView().setZoom(17);
  var sideBarOpened = false;
  $('#sidebar-main-block').html('');
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    var p = feature.getProperties();
    var message = '';
    if(p.RIV_NA) {
      message += '<h3>' + p.RIV_NA + '</h3>';
      message += '<br />河川: ' + p.RV_NAME;
      message += '<br />河川排水: ' + p.RIV_NA;
      $('#sidebar-main-block').append(message);
      if(false === sideBarOpened) {
        sideBarOpened = true;
        sidebar.open('home');
        map.getView().fit(feature.getGeometry());
      }
    } else if(p.DR_NAME) {
      message += '<h3>' + p.DR_NAME + '</h3>';
      message += '<br />河川: ' + p.RV_NAME;
      message += '<br />行政區: ' + p.TOWN_NAME;
      $('#sidebar-main-block').append(message);
      if(false === sideBarOpened) {
        sideBarOpened = true;
        sidebar.open('home');
        map.getView().fit(feature.getGeometry());
      }
    } else if(p.code) {
      message += '<h3>' + p.name + '</h3>';
      message += '<br />站碼: ' + p.code;
      message += '<br />河川分區: ' + p.type;
      message += '<br />行政區: ' + p.area;
      message += '<br />轄管單位: ' + p.admin;
      message += '<br />河川排水: ' + p.river;
      if(p.image && p.image !== '') {
        message += '<br /><img src="' + p.image + '" width="380" />';
      } else {
        message += '<br />警戒狀態: ' + p.alert_level;
        message += '<br />說明: ' + p.warn_info;
        message += '<br />時間: ' + p.date;
      }
      $('#sidebar-main-block').append(message);
      if(false === sideBarOpened) {
        var fCenter = feature.getGeometry().getCoordinates();
        sideBarOpened = true;
        sidebar.open('home');
        map.getView().setCenter(fCenter);
      }
    }
  });
});

var riverLayers = [];
for (k in rivers) {
  $.getJSON('https://h.olc.tw/TainanWaterMap.php?river=' + rivers[k], {}, function (i) {
    var riverFc = [];
    for (g in i.local_wst_warn_info) {
        var key = i.local_wst_warn_info[g].st_no;
        if (key.substr(0, 1) === 'V') {
          continue;
        }
        if (!points[key]) {
            console.log(key);
            continue;
        }
        points[key].alert_level = i.local_wst_warn_info[g].alert_level;
        points[key].change = i.local_wst_warn_info[g].change;
        points[key].date = i.local_wst_warn_info[g].date;
        points[key].info = i.local_wst_warn_info[g].info;
        points[key].warn_info = i.local_wst_warn_info[g].warn_info;
        var p = points[key];
        if(p.alert_level === '未達警戒') {
          p.fType = 'green';
        } else {
          p.fType = 'red';
        }
        p.geometry = new ol.geom.Point(ol.proj.fromLonLat([points[key].longitude, points[key].latitude]));
        var f = new ol.Feature(p);
        riverFc.push(f);
    }
    var riverLayer = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: riverFc
      }),
      style: function(f) {
        var fStyle;
        if(f.get('alert_level') === '未達警戒') {
          fStyle = pointGreenStyle.clone();
        } else {
          fStyle = pointRedStyle.clone();
        }
        return fStyle;
      },
      map: map
    });
    riverLayers.push(riverLayer);
  });
}

$('a.btnShowAll').click(function() {
  sidebar.close();
  var baseExtent = ol.extent.createEmpty();
  map.getLayers().forEach(function(layer) {
    if(layer instanceof ol.layer.Vector) {
      ol.extent.extend(baseExtent, layer.getSource().getExtent());
    }
  });
  map.getView().fit(baseExtent);

  for(k in riverLayers) {
    riverLayers[k].getSource().forEachFeature(function(f) {
      if(f.get('fType') === 'green') {
        f.setStyle(pointGreenStyle);
      } else {
        f.setStyle(pointRedStyle);
      }
    })
  }
  targetLayer.getSource().forEachFeature(function(f) {
    var fStyle = pointStyle.clone();
    fStyle.getText().setText(f.get('name'));
    f.setStyle(fStyle);
  });

  return false;
});

var emptyStyle = new ol.style.Style({ image: '' });

$('a.btnShowImg').click(function() {
  sidebar.close();
  var baseExtent = ol.extent.createEmpty();
  for(k in riverLayers) {
    riverLayers[k].getSource().forEachFeature(function(f) {
      f.setStyle(emptyStyle);
    })
  }
  targetLayer.getSource().forEachFeature(function(f) {
    var fStyle = pointStyle.clone();
    fStyle.getText().setText(f.get('name'));
    f.setStyle(fStyle);
    ol.extent.extend(baseExtent, f.getGeometry().getExtent());
  });
  map.getView().fit(baseExtent);
  return false;
});

$('a.btnShowRed').click(function() {
  sidebar.close();
  var baseExtent = ol.extent.createEmpty();
  for(k in riverLayers) {
    riverLayers[k].getSource().forEachFeature(function(f) {
      if(f.get('fType') === 'green') {
        f.setStyle(emptyStyle);
      } else {
        ol.extent.extend(baseExtent, f.getGeometry().getExtent());
        f.setStyle(pointRedStyle);
      }
    })
  }
  targetLayer.getSource().forEachFeature(function(f) {
    f.setStyle(emptyStyle);
  });
  map.getView().fit(baseExtent);
  return false;
});
