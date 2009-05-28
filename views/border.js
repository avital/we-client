// we store these beforehand because once this code is done executing
// all the elements of this document will start loading and some of them
// also have an element with weid=type and property, so it would find
// the wrong one
var typeNode = $we('type')
var propertyNode = $we('property')

$each($H(doc).getKeys().sort(), function(property) {
  if (property[0] != '_') {
    var value = doc[property]
    var liItem = new Element('li').inject($we('list'))

    $we('remove').clone().setStyle('display', 'inline').inject(liItem)
    $we('remove', liItem).addEvent('click', function() {
      $save(function(doc) {
        delete doc[property]
      })
    })
    
    liItem.appendText(property + ': ')

    var taskid = $task()
    if ($type(value) == 'object') {
      We.view(value, function(newLiItem) {
        newLiItem.inject(liItem)
        $taskdone(taskid)  
      })
    }
  }
})

propertyNode.addEvent('keypress', function(event) {
  if (event.event.keyCode == 13) {
    var type = typeNode.get('value');
    var value;
    var textPrototype = {_view: 'text', value: '[set value]'}
  
    if (type == 'text')
      value = textPrototype
    else if (type == 'object')
      value = {}
    else if (type == 'collection')
      value = {_view: 'collection', value: []}
    else if (type == 'collectiontext')
      value = {_view: 'collection', value: [], prototype: textPrototype}
    
    $save(function(doc) {
      doc[propertyNode.get('value')] = value;
    })
  }
})
