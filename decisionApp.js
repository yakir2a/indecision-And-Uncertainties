var decision = (function () {
  /*
      will hold the current state of the app
      *stateDecision: hold the current level nodes
      *indecision: holds the initial indecisions tables roots
      *stage: hold the current stage name
              (initialize,filling_indecision,filling_uncertainty,
               table_indecision_input,table_uncertainty_input,
               indecision_or_uncertainty,indecision_or_end,
               table_benefit)
  */

  var state = {
    stateDecision: [],
    next_stateDecision: [],
    indecision: [],
    stage: undefined,
    fill: undefined,
    counter: undefined
  }

  var initModule = function () {
    var indecisionCount = $('input#input').val()
    state.indecisionCount = indecisionCount
    state.fill = fill()
    state.counter = count()
    $('#tables')
      .append(`<form id="input_table" action="javascript:void(0);" onsubmit="decision.stage('table_indecision_input',event)" required>\
    <input id="table_submit" type="submit" value="submit"></form>`)
    for (i = 0; i < indecisionCount; i++) {
      //set root decision's
      state.indecision.push(
        new nodeBlock(
          'decision',
          $(`<table style="width:100%" id="decision">\
                  <tr>\
                    <td><input id="input" type="field" required></td>\
                  </tr>\
                </table>`)
        )
      )
      //add current decisionBlock to state
      state.stateDecision.push([state.indecision[i]])
      state.counter.addObj(state.indecision[i])
      $('#input_table').prepend(
        `<table style="width:100%" class="first"> \
          <tr> \
            <td style="width:15%"> \
              <table style="width:100%;height:100%;" class="removing" id="step-${i}"> \
                <tr> \
                  <td>התלבטות</td> \
                </tr>\
              </table> \
            </td> \
            <td> \
              <table-${i}>\
            </td> \
          </tr> \
        </table><br />`
      )
      $(`table-${i}`).replaceWith(state.indecision[i].block)
    }
    $('form#input').empty()
    $('form#input').append(`<h3>הכנס את ההתלבטויות</h3>`)
    $('form#input').removeAttr('onsubmit')
  }
  /*
      *stage: hold the current stage name
              (initialize,table_build,filling_indecision,filling_uncertainty,
               table_indecision_input,table_uncertainty_input,
               indecision_or_uncertainty,indecision_or_end,
               table_benefit,folding_result)
*/
  function stage(submitStage, event = undefined) {
    console.log('next stage: ', submitStage)
    switch (submitStage) {
      case 'initialize':
        if (state.stage == undefined) {
          console.log('initialize stage')
          initModule()
          state.stage = 'initialize'
        }
        break
      case 'table_build':
        if (
          [
            'filling_indecision',
            'filling_uncertainty',
            'table_benefit',
          ].includes(state.stage)
        ) {
          console.log(`table_build stage, from ${state.stage} stage`)
          //remove the input menu
          $('form#input').empty()

          if (state.stage == 'filling_indecision') {
            $('form#input').append(`<h3>הכנס את ההתלבטויות</h3>`)
            $('form#input').removeAttr('onsubmit')
            $(`#input_table`).attr(
              'onsubmit',
              'decision.stage("table_indecision_input",event)'
            )
            state.fill.fillObjs()
            state.counter.increaseCount()
          } else if (state.stage == 'filling_uncertainty') {
            $('form#input').append(`<h3>הכנס את מצבי אי הוודאות (בשורה העליונה) ואת הסתברותם (בשורה התחתונה)</h3>`)
            $('form#input').removeAttr('onsubmit')
            $(`#input_table`).attr(
              'onsubmit',
              'decision.stage("table_uncertainty_input",event)'
            )
            state.fill.fillObjs()
            state.fill.fillObjs()
            state.counter.increaseCount()
            state.counter.increaseCount()
          } else {
            $('form#input').append(
              `<h3>הכנס את התועלת לכל אפשרות (מינוס 10 עד 10)</h3>`
            )
            $('form#input').removeAttr('onsubmit')
            $(`#input_table`).attr(
              'onsubmit',
              'decision.stage("table_benefit_input",event)'
            )
          }

          state.stateDecision.forEach(function (table, index) {
            table_build(table, state.stage, index)
          })
          $(`#input_table`).append(
            `<input id="table_submit" type="submit" value="submit">`
          )
          state.stage = 'table_build'
        }
        break
      case 'filling_indecision':
        if (
          ['indecision_or_uncertainty', 'indecision_or_end'].includes(
            state.stage
          )
        ) {
          console.log(`filling_indecision stage, from ${state.stage} stage`)
          $('form#input').empty()
          filling_indecision()
          state.stage = 'filling_indecision'
        }
        break
      case 'filling_uncertainty':
        if (['indecision_or_uncertainty'].includes(state.stage)) {
          console.log(`filling_uncertainty stage, from ${state.stage} stage`)
          $('form#input').empty()
          filling_uncertainty()
          state.stage = 'filling_uncertainty'
        }
        break
      case 'table_indecision_input':
        if (['initialize', 'table_build'].includes(state.stage)) {
          console.log(`table_indecision_input stage, from ${state.stage} stage`)
          state.stage = 'table_indecision_input'
          table_indecision_input()
          stage('indecision_or_uncertainty')
        }
        break
      case 'table_uncertainty_input':
        if (['table_build'].includes(state.stage)) {
          console.log(
            `table_uncertainty_input stage, from ${state.stage} stage`
          )
          if (checkProbabilty()) {
            table_uncertainty_input()
            state.stage = 'table_uncertainty_input'
            stage('indecision_or_end')
          } else {
            alert(
              'נה למלא את הסתברויות של כל אי ודאות בצורה נכונה(חיבור שלהם צריך להיות שווה 1)'
            )
          }
        }
        break
      case 'table_benefit_input':
        if (['table_build'].includes(state.stage)) {
          console.log(`table_benefit stage, from ${state.stage} stage`)
          table_benefit_input()
          state.stage = 'table_benefit_input'
          stage('folding_result')
        }
        break
      case 'indecision_or_uncertainty':
        if (['table_indecision_input'].includes(state.stage)) {
          console.log(
            `indecision_or_uncertainty stage, from ${state.stage} stage`
          )
          $('form#input').empty()
          $('form#input').append(`<h3>התלבטות או אי וודאות?</h3>\
                            <input value="התלבטות" onclick="decision.stage('filling_indecision')" type="button"> \
                            <input value="אי וודאות" onclick="decision.stage('filling_uncertainty')" type="button">`)

          state.stage = 'indecision_or_uncertainty'
        }
        break
      case 'indecision_or_end':
        if (['table_uncertainty_input'].includes(state.stage)) {
          console.log(`indecision_or_end stage, from ${state.stage} stage`)

          $('form#input').empty()
          $('form#input').append(`<h3>התלבטות או סיום?</h3>\
                            <input value="התלבטות" onclick="decision.stage('filling_indecision')" type="button"> \
                            <input value="סיום" onclick="decision.stage('table_benefit')" type="button">`)

          state.stage = 'indecision_or_end'
        }
        break
      case 'table_benefit':
        if (['indecision_or_end'].includes(state.stage)) {
          console.log(`table_benefit stage, from ${state.stage} stage`)
          state.stage = 'table_benefit'
          stage('table_build')
        }
        break
      case 'folding_result':
        if (['table_benefit_input'].includes(state.stage)) {
          console.log(`folding_result stage, from ${state.stage} stage`)
          $('form#input').empty()
          $('form#input').append(`<h3>מכנס את התוצאות</h3>`)
          console.log(state.stateDecision)
          folding()
        }
        break
    }
  }

  var table_build = function (table_nodes, stage, index) {
    var new_nodes = []
    switch (stage) {
      case 'filling_indecision':
        $(`#step-${index}`).append(`<tr> \
                               <td>התלבטות</td> \
                               </tr>`)
        table_nodes.forEach(function (node) {
          if (node.type === 'fill') {
            new_nodes.push(node)
            return
          }
          var indecision = parseInt($(node.numberOfChilds).val())
          $(node.block)
            .find('tr:last')
            .after(`<tr><td><table id="childs"></table></td></tr>`)
          if (indecision == 0) {
            var newFill = $(
              `<table style="width:100%"><tr><td></td></tr></table>`
            )
            child = new nodeBlock('fill', newFill, node)
            node.childs.push(child)
            node.childType = 'fill'
            new_nodes.push(child)
            state.fill.addObj(newFill)
            $(node.block).find(`#childs`).replaceWith(newFill)
            return
          }
          node.childType = 'decision'
          for (i = 0; i < indecision; i++) {
            var child = new nodeBlock(
              'decision',
              $(`<table style="width:100%" id="decision">\
                  <tr>\
                    <td><input id="input" type="field" required></td>\
                  </tr>\
                </table>`),
              node
            )
            state.counter.addObj(child)
            node.childs.push(child)
            new_nodes.push(child)
            $(node.block).find(`#childs`).append(`<td></td>`)
            $(node.block).find(`#childs td:last`).append(child.block)
          }
        })
        state.stateDecision[index] = new_nodes
        break
      case 'filling_uncertainty':
        $(`#step-${index}`).append(`<tr> \
                               <td>אי וודאות</td> \
                               </tr>\
                               <tr> \
                               <td>הסתברות</td> \
                               </tr>`)
        table_nodes.forEach(function (node) {
          if (node.type === 'fill') {
            new_nodes.push(node)
            return
          }
          var uncertainty = parseInt($(node.numberOfChilds).val())
          $(node.block)
            .find('tr:last')
            .after(`<tr><td><table id="childs"></table></td></tr>`)
          if (uncertainty == 0) {
            var newFill = $(
              `<table style="width:100%"><tr><td></td></tr><tr><td></td></tr></table>`
            )
            child = new nodeBlock('fill', newFill, node)
            node.childs.push(child)
            node.childType = 'fill'
            new_nodes.push(child)
            state.fill.addObj(newFill)
            $(node.block).find(`#childs`).replaceWith(newFill)
            return
          }
          node.childType = 'uncertainty'
          for (i = 0; i < uncertainty; i++) {
            var child = new nodeBlock(
              'uncertainty',
              $(`<table style="width:100%" id="uncertainty">\
                  <tr>\
                    <td><input id="input_uncertainty" type="field" required></td>\
                  </tr>\
                  <tr>\
                    <td><input id="input_probabilty" type="number" step="0.01" min="0" max="1" required></td>\
                  </tr>\
                </table>`),
              node,2
            )
            state.counter.addObj(child)
            node.childs.push(child)
            new_nodes.push(child)
            $(node.block).find(`#childs`).append(`<td></td>`)
            $(node.block).find(`#childs td:last`).append(child.block)
          }
        })
        state.stateDecision[index] = new_nodes
        break
      case 'table_benefit':
        $(`#step-${index}`).append(`<tr> \
                                 <td>תועלת</td> \
                                 </tr>`)
        table_nodes.forEach(function (node) {
          node.benefit = $(
            `<tr><td><input id="input_probabilty" type="number" step="0.1" min="-10" max="10" required></td></tr>`
          )
          $(node.block).find('tr:last-child').after(node.benefit)
        })
        break
    }
  }

  //return the path of each pick
  function child_tree(node) {
    get_path = []
    for (; node.parent != undefined; node = node.parent) {
      get_path.unshift($.trim($(node.block).find('td:first').text()))
    }
    get_path.unshift($.trim($(node.block).find('td:first').text()))
    return get_path
  }

  function nodeBlock(blockType, block = undefined, parent = undefined, count = 0) {
    this.type = blockType
    this.block = block
    this.numberOfChilds = undefined
    this.childType = undefined
    this.childs = []
    this.benefit = undefined
    this.parent = parent
    this.count = count
  }

  var table_indecision_input = function () {
    $('#table_submit').remove()
    var indecisionCount = []
    for (i = 0; i < state.indecisionCount; i++)
      indecisionCount.push.apply(indecisionCount, state.stateDecision[i])
    indecisionCount.forEach(function (setData, index) {
      if (setData.type === 'fill') return
      var decision = $(setData.block).find(`input`).val()
      decision = $(`<p id="input_decision">${decision}</p>`)
      $(setData.block).find(`input`).replaceWith(decision)
    })
  }

  var table_uncertainty_input = function () {
    $('#table_submit').remove()
    var uncertaintyCount = []
    for (i = 0; i < state.indecisionCount; i++)
      uncertaintyCount.push.apply(uncertaintyCount, state.stateDecision[i])
    uncertaintyCount.forEach(function (setData, index) {
      if (setData.type === 'fill') return
      var uncertainty = $(setData.block).find(`#input_uncertainty`).val()
      uncertainty = $(`<p id="input_uncertainty">${uncertainty}</p>`)
      $(setData.block).find(`#input_uncertainty`).replaceWith(uncertainty)

      var probabilty = $(setData.block).find(`#input_probabilty`).val()
      probabilty = $(`<p id="input_probabilty">${probabilty}</p>`)
      $(setData.block).find(`#input_probabilty`).replaceWith(probabilty)
    })
  }

  var table_benefit_input = function () {
    $('#table_submit').remove()
    var benefitCount = []
    for (i = 0; i < state.indecisionCount; i++)
      benefitCount.push.apply(benefitCount, state.stateDecision[i])
    benefitCount.forEach(function (setData, index) {
      var benefit = $(setData.benefit).find(`input`).val()
      $(setData.benefit).find(`input`).replaceWith(benefit)
    })
  }

  var filling_indecision = function () {
    var indecisionCount = []
    for (i = 0; i < state.indecisionCount; i++)
      indecisionCount.push.apply(indecisionCount, state.stateDecision[i])
    indecisionCount.forEach(function (setData, index) {
      if (setData.type === 'fill') return
      setData.numberOfChilds = $(
        `<input id="input-${index}" type="number" min="0" required>`
      )
      var path = child_tree(setData).reduce(function (prev, current) {
        return prev + ', ' + current
      })

      $('form#input').append(
        `<label id="input-${index}" for="input-${index}">אם ${path} כמה התלבטויות? </label>`
      )

      $(`form#input label#input-${index}`).append(
        setData.numberOfChilds,
        '<br/>'
      )
    })
    $('form#input').attr('onsubmit', "decision.stage('table_build',event)")
    $('form#input').append('<input id="input" type="submit" value="submit">')
  }

  var filling_uncertainty = function () {
    var indecisionCount = []
    for (i = 0; i < state.indecisionCount; i++)
      indecisionCount.push.apply(indecisionCount, state.stateDecision[i])
    indecisionCount.forEach(function (setData, index) {
      if (setData.type === 'fill') return
      setData.numberOfChilds = $(
        `<input id="input-${index}" type="number" min="0" required>`
      )
      var path = child_tree(setData).reduce(function (prev, current) {
        return prev + ', ' + current
      })

      $('form#input').append(
        `<label id="input-${index}" for="input-${index}">אם ${path} כמה מצבי אי וודאות ישנם? </label>`
      )

      $(`form#input label#input-${index}`).append(
        setData.numberOfChilds,
        '<br/>'
      )
    })
    $('form#input').attr('onsubmit', "decision.stage('table_build',event)")
    $('form#input').append('<input id="input" type="submit" value="submit">')
  }

  var checkProbabilty = function () {
    this.leafs = []
    this.checked = []
    this.pass = []
    for (i = 0; i < state.indecisionCount; i++)
      leafs.push.apply(leafs, state.stateDecision[i])
    leafs.forEach(function (leaf) {
      if (leaf.type === 'fill') return
      if (!checked.includes(leaf.parent)) {
        this.checked.push(leaf.parent)
        this.sum = 0
        leaf.parent.childs.forEach(function (brother) {
          sum += parseFloat($(brother.block).find('#input_probabilty').val())
        }, this)
        if (this.sum.toFixed(3) == 1) {
          leaf.parent.childs.forEach(function (brother) {
            $(brother.block).find('#input_probabilty').removeClass('error')
          })
          this.pass.push(leaf.parent)
        } else {
          leaf.parent.childs.forEach(function (brother) {
            $(brother.block).find('#input_probabilty').addClass('error')
          })
        }
      }
    }, this)
    if (checked.length == pass.length) return true
    return false
  }

  var folding = function () {
    var next = []
    var current = []
    for (i = 0; i < state.indecisionCount; i++)
      next.push.apply(next, state.stateDecision[i])
    next.forEach(function (leaf, index, arr) {
      arr[index] = leaf.parent
    })
    //-----looping here
    var fold = setInterval(function(){
      if(!next.length){
        clearInterval(fold)
        showResult()
        return
      }
      current = Array.from(new Set(next))
      next = []
      current = current.filter(function (ready) {
        check = ready.childs
          .map(currentValue => {
            return currentValue.benefit != undefined ? true : false
          })
          .reduce(function (checked, next) {
            return checked && next ? true : false
          })
        return check
      })
      current.forEach(function(parent){
        if(parent.parent != undefined)
          next.push(parent.parent)
        
        switch(parent.childType){
          case 'decision':
            //----fold decision
            const pick = parent.childs.reduce(function(prev, current){
                return parseFloat($(prev.benefit).text()) > parseFloat($(current.benefit).text())? prev : current
            })
            parent.childs = [pick]
            parent.benefit = pick.benefit
            $(parent.block).find(pick.block).parent().siblings().remove()
            break
          case 'uncertainty':
            //----fold uncertainty
            const benefit = parent.childs.map(function(child){
              return parseFloat(child.block.find(`#input_probabilty`).text())*parseFloat(child.benefit.text())
            }).reduce(function(prev,current){return prev+current}).toFixed(3)
            $(parent.block).find('#childs').replaceWith('<table style="width:100%" id="fill"></table>')
            var tmp = ''
            for(i = 0 ; i <= parent.count ; i++){
               tmp += '<tr><td></td></tr>'
            }
            $(parent.block).find('#fill').append(tmp)
            parent.benefit = $(parent.block).find('#fill tr:last-child')
            $(parent.benefit).find('td').append(benefit)
            break
          case 'fill':
            parent.benefit = parent.childs[0].benefit
        }
      })
    },1500,next)
  }

  //watcher for all the fill table elements
  var fill = function () {
    var watchObjs = []
    var addObj = function (fill) {
      watchObjs.push(fill)
    }
    var fillObjs = function () {
      watchObjs.forEach(function (Obj) {
        Obj.append('<tr><td></td></tr>')
      })
    }
    var removeObj = function(number){
      watchObjs.forEach(function (Obj) {
        for(i = 0 ; i < number ; i++)
          Obj.find('tr:first-child td:empty').parent().remove()
      },number)
    }
    return { addObj: addObj, fillObjs: fillObjs }
  }
  //watcher for all the all table elements to keep count of rows
  var count = function(){
    var watchObjs = []
    var addObj = function (count) {
      watchObjs.push(count)
    }
    var increaseCount = function () {
      watchObjs.forEach(function (Obj) {
        Obj.count++
      })
    }
    return {addObj: addObj, increaseCount:increaseCount}
  }

  var showResult = function(){
    const picked = state.indecision.reduce(function(prev,current){
      a = parseFloat($(prev.benefit).text()).toFixed(3)
      b = parseFloat($(current.benefit).text()).toFixed(3)
      return a > b ? prev : current
      })
    var result = $(`<br><table class="result"><tr></tr></table>`)
    var tmp = result.find('tr')
    create_result_table(picked,tmp,1)
    $('#tables').append('<h3>הראה את הפתרון:<h3><hr>')
    $('#tables').append(result)
  }
  
 var create_result_table = function(node,element,index){
	if(node.type == 'decision'){
		if(!node.childs.length || node.childType == 'fill'){
		    element.append(`<td><b style="color:blue"><u>${$(node.block).find("#input_decision").text()}</u></b></td>`)
      return;
    }
		else{
	      element.append(`<td><b style="color:blue"><u>${$(node.block).find("#input_decision").text()}</u> ---></b></td>`)
        create_result_table(node.childs[0],element,index++)
    }
        }else if(node.type == 'uncertainty'){
		if(!node.numberOfChilds || node.childType == 'fill')
			return;
          element.append(`<td><b style="color:green">${$(node.block).find("#input_uncertainty").text()} ---></b></td>`)
          create_result_table(node.childs[0],element,index++)	
        }
	for(i = 1 ; i < node.numberOfChilds ; i++){
		tmp = $('<tr></tr>')
		for(j = 0 ; j < index ; j++)
			tmp.append('<td> </td>')
		element.after(tmp)
		create_result_table(node.childs[i],tmp,index++)	
  }
}
  
  return { stage: stage }
})()
$(document).ready(function () {
  decision
})
