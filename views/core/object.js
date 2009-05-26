$each($H(doc).getKeys().sort(), function(property) {
  if (property[0] != '_') {
    var value = doc[property]
    var liItem = new Element('li').inject($we('list'))

    $we('remove').clone().setStyle('display', 'inline').inject(liItem)
    $we('remove', liItem).addEvent('click', function() {
      delete doc[property]
      $save()
    })
    
    liItem.appendText(property + ': ')

    var type = $type(value);
    if (type == 'object' || type == 'array') {
      We.view(value, function(newLiItem) {
        newLiItem.inject(liItem)
      }, {enclosing: enclosing})
    }
    else {
      $we('prototype').clone().setStyle('display', 'inline').inject(liItem)
      var text = $we('text', liItem).set('text', value)
      var textEdit = $we('textedit', liItem).set('value', value)
      
      text.addEvent('click', function() {
        this.setStyle('display', 'none')
        textEdit.setStyle('display', 'inline')
        textEdit.focus()
      })
      
      textEdit.addEvent('blur', $reload)
      
      textEdit.addEvent('keypress', function(event) {
        if (event.event.keyCode == 13) {
          doc[property] = textEdit.get('value')
          $save()
        }
      })
    }
  }
})

// we store these beforehand because once this code is done executing
// all the elements of this document will start loading and some of them
// also have an element with weid=type and property, so it would find
// the wrong one
var typeNode = $we('type')
var propertyNode = $we('property')

$we('add').addEvent('click', function() {
  var type = typeNode.get('value');
  var value;
  
  if (type == 'string')
    value = '[set value]'
  else if (type == 'object')
    value = {}
  else if (type == 'array')
    value = []
    
  doc[propertyNode.get('value')] = value;
  $save()
})
