$each(doc, function(value, index) {
  var liItem = new Element('li').inject($we('list'))

  $we('remove').clone().setStyle('display', 'inline').inject(liItem)
  $we('remove', liItem).addEvent('click', function() {
    doc.splice(index, 1)
    $save()
  })
    
  We.view(value, function(newLiItem) {
    newLiItem.inject(liItem)
  })
})

$we('add').addEvent('click', function() {
  doc.push({})
  $save()
})
