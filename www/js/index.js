/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var map, maxlat, maxlng, minlat, minlng, intensity, minDate, dt;
var markers =[];
var dataset = [];
var dataBase = []; /* array2 */
var nxtQuery = [];/* array */;

$(document).ready( function(){
    dt = $('#table_id').DataTable({
        data: dataset,
        scrollX: true,
        columns: [
            { title: "Título"},
            { title: "Magnitud"},
            { title: "Fecha"},
            { title: "Latitud"},
            { title: "Longitud"},
            { title: "URL"},
        ],
        searching: false,
        paging: false,
        lengthChange: false,
    });
    $('#table_id').css('width','420px');
    $('#table_id tbody').on('click', 'tr', function(){
        var data = dt.row(this).data();
        clearMarkers();
        markers = [];
        markers.push(new google.maps.Marker({
            map: map,
            position: {lat: data[3], lng: data[4]},
            title: data[0],
        }));
        map.setZoom(15);
    });
    document.getElementById('btnChangeAddress').addEventListener('click', function(){
        $('.searchAddressAgain').css('display', 'none');
        $('.searchIntensityDisplay').css('display', 'none');
        $('.searchAddressDisplay').css('display', 'block');
        $('.searchIntensityAgain').css('display', 'none');
    });
    document.getElementById('btnSearchAgain').addEventListener('click', function(){
        $('.searchAddressAgain').css('display', 'none');
        $('.searchIntensityDisplay').css('display', 'none');
        $('.searchAddressDisplay').css('display', 'block');
        $('.searchIntensityAgain').css('display', 'none');
        $('.tableContainer').css('display', 'none');
        clearMarkers();
        dt.clear().draw();
    });
});
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -33.4726900, lng: -70.6472400},
        zoom: 15
    })
    var geocoder = new google.maps.Geocoder();
    document.getElementById('btnSearch').addEventListener('click', function(){
        changeAddress(geocoder, map);
    });
    document.getElementById('searchEarthQuake').addEventListener('click', function(){
        searchEarthQuake(maxlat, maxlng, minlat, minlng);
    });
    
    
};


function changeAddress(geocoder, map) {
    var address = document.getElementById('address').value;
    geocoder.geocode({'address': address }, function(results, status){
        if(status === 'OK') {
            $('.searchAddressDisplay').css('display', 'none');
            $('.searchAddressAgain').css('display', 'block');
            $('.searchIntensityDisplay').css('display', 'block');
            $('.searchIntensityAgain').css('display', 'none');
            map.setCenter(results[0].geometry.location);
            markers.push(new google.maps.Marker({
                map: map,
                position: results[0].geometry.location
            }));
            maxlat = ( results[0].geometry.location.lat() + 1); 
            maxlng = ( results[0].geometry.location.lng() + 1); 
            minlat = ( results[0].geometry.location.lat() - 1); 
            minlng = ( results[0].geometry.location.lng() - 1); 
        } else {
            console.log('Fallo ' + status);
        }
    });
}
function searchEarthQuake(maxlat, maxlng, minlat, minlng) {
    minDate = document.getElementById('minDate').value;
    intensity = document.getElementById('minIntensity').value;

    $.ajax({
        url: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime='+minDate+'&minlatitude='+minlat+'&maxlatitude='+maxlat+'&minlongitude='+minlng+'&maxlongitude='+maxlng+'&minmagnitude='+intensity+'',
        success: function (result){
            markers = [];
            clearMarkers();
            map.setZoom(5);
            result.features.forEach(function(element){
                markers.push(new google.maps.Marker({
                    map: map,
                    position: {lat: element.geometry.coordinates[1], lng: element.geometry.coordinates[0]},
                    title: element.properties.title
                }));
            $('.tableContainer').css('display', 'block');
                dataBase.push( (new Date(element.properties.time)).toUTCString() );
                dataBase.push(element.properties.title);
                dataBase.push(element.properties.mag);
                nxtQuery.push(dataBase);
                dataBase = [];
                utc = new Date(element.properties.time);
                dt.row.add([element.properties.title, element.properties.mag, utc.toDateString(), element.geometry.coordinates[1], element.geometry.coordinates[0], '<a href="'+element.properties.url+'">URL</a>']).draw();
            });

            $('.searchAddressDisplay').css('display', 'none');
            $('.searchAddressAgain').css('display', 'none');
            $('.searchIntensityDisplay').css('display', 'none');
            $('.searchIntensityAgain').css('display', 'block');
            sql2(nxtQuery);
        },
        error: function(result){
            console.log(result);
        }
    });
}
function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
}

function clearMarkers() {
    setMapOnAll(null);
}
function sql2(array2)
{	
    var db = sqlitePlugin.openDatabase('Sismos.db', '1.0', '', 10*20);
    if(array2.length > 0) {
        db.transaction(function (txn) {
            txn.executeSql('CREATE TABLE IF NOT EXISTS Lugares (id integer primary key, titulo, magnitud, tiempo)');
            txn.executeSql('delete from Lugares');
            array2.forEach(function(element){
                txn.executeSql('INSERT INTO Lugares (tiempo, magnitud, titulo) VALUES (?,?,?)', [element[0], element[2], element[1]]);
            });

            txn.executeSql('SELECT * FROM Lugares', [], function(tx, results) {
                alert("Guardado con exito!, pasando a Prueba...");
                alert(results.rows.item(0).titulo);
            }, null);
        });
    }
}