var textNode = $we('text')
var textEditNode = $we('textedit')

textNode.addEvent('click', function() {
  // $fix3: should we do this with Element.replaces?
  this.setStyle('display', 'none')
  textEditNode.setStyle('display', 'inline')
  textEditNode.focus()
})

var save = function() {
  $save(function(doc) {
    doc.value = textEditNode.get('value')
  })
}

textEditNode.addEvent('blur', $reload)

textEditNode.addEvent('keypress', function(event) {
  if (event.event.keyCode == 13)
    save()
  else if (event.event.keyCode == 27)
    $reload()
})
