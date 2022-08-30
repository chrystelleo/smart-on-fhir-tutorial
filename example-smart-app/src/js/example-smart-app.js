(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|85354-9', 
                              'http://loinc.org|8310-5', 'http://loinc.org|2708-6',
                              'http://loinc.org|32309-7', 'http://loinc.org|29463-7']
                      }
                    }
                  });
        var alg = smart.patient.api.fetchAll({
                    type: 'AllergyIntolerance',
                    query: {
                      "clinical-status": 'active'
                    }
                  });    

        $.when(pt, obv, alg).fail(onError);

        $.when(pt, obv, alg).done(function(patient, obv, allergies) {
            console.log(patient);
            console.log(allergies);
            console.log(obv);
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family;  
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('85354-9'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('85354-9'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');
          var tmp = byCodes('8310-5');
          var spo2 = byCodes('2708-6');
          var chol = byCodes('32309-7');
          var weight = byCodes('29463-7');
          var allergyTable = "<table>";
          var allergyLen = allergies.length;
          console.log(allergyLen);
          for(var i=0;i<allergyLen;i++){
            var reactionStr = [];
            console.log(allergies[i].code.text);
            if(allergies[i].reaction !== undefined){              
              for(var j=0,jLen=allergies[i].reaction.length;j<jLen;j++){
                reactionStr.push(allergies[i].reaction[j].manifestation[0].text);
                console.log("reaction: "+allergies[i].reaction[j].manifestation[0].text);
              }
              allergyTable += "<tr><td>Allergy code: "+allergies[i].code.text+"</td><td>Reaction: "+reactionStr.join(", ")+"</td></tr>";
              console.log(" Allergy code: "+allergies[i].code.text+" Reaction: "+reactionStr.join(", "));
            }
            if(allergyLen === 0){
                allergyTable =+ "<tr><td>No Allergies Documented</td></tr>";
            }
          }
          allergyTable =+ "</table>";
          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);
          p.tmp = getQuantityValueAndUnit(tmp[0]);
          p.spo2 = getQuantityValueAndUnit(spo2[0]);
          p.chol = getQuantityValueAndUnit(chol[0]);
          p.weight = getQuantityValueAndUnit(weight[0]);
          p.alg = allergyTable;
          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      tmp: {value: ''},
      spo2: {value: ''},
      chol: {value: ''},
      weight: {value: ''},
      alg: {value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }
 
  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
    $('#tmp').html(p.tmp);
    $('#spo2').html(p.spo2);
    $('#chol').html(p.chol);
    $('#weight').html(p.weight);
    $('#alg').html(p.alg);
  };

})(window);
