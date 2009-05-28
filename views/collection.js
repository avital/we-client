$each(doc.value, function(value, index) {
  var liItem = new Element('li').inject($we('list'))

  $we('remove').clone().setStyle('display', 'inline').inject(liItem)
  $we('remove', liItem).addEvent('click', function() {
    $save(function(doc) {
      doc.value.splice(index, 1)
    })
  })

  var taskid = $task()    
  We.view(value, function(newLiItem) {
    newLiItem.inject(liItem)
    $taskdone(taskid)
  })
})

$we('add').addEvent('click', function() {
  var prototype
    
  if (doc.prototype)
    prototype = We.cleanObject(doc.prototype)
  else
    prototype = {}
      
  $save(function(doc) {
    doc.value.push(prototype)
  })
})

