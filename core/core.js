if (typeof(console) == 'undefined') {
  console = {
    log: function() {
    }
  }
}

We = {
  store: {},
  persist: new Persist.Store('We'),

  getURL: function(url, next, nocache) {
    if (!nocache) {
      if (We.store[url])
        next(We.store[url])
      else
        We.getURL(url, next, true)
    }
    else {
      new Request({
        method: 'get',
        url: url,
        onComplete: function(val) {
          We.store[url] = val
          next(val)
        }
      }).send()
    }
  },

  load: function(id, next, bare) {
    We.getURL('../object/' + id + (bare ? '/bare' : ''), function(response) {
      next(JSON.decode(response))
    }, true)
  },
  
  save: function(doc, alter) {
    var id = doc['_object-id']
    We.load(id, function(doc) {
      doc = alter(doc) || doc
      
      new Request({
        url: '../object/' + id,
        data: {
          doc: JSON.encode(doc)
        },
        onSuccess: function(response) {
          if (!response) // has changed in the meanwhile - retry; $fix: timeout?
            We.save(doc, alter)
          else
            We.reload(JSON.decode(response))
        }
      }).send()
    }, true)
  },
  
  view: function(doc, next, options) {
    // use $merge?
    var options = options || {}      
    var node = new Element(options.tag || 'span')

    We.register(doc, node)

    var docViewUrl;

    console.log(doc)

    if (doc._view)
      docViewUrl = '../view/' + doc._view // $fix: objects?
    else
      docViewUrl = '../view/object' // default view

    // $fix3: write script to package .js, .html and .css into one .js file
    We.getURL(docViewUrl + '.html', function(html) {
      node.set('html', html)
      
      // $fix3: there is a bug here with the css selector - it can't be we-doc-key
      // it should actually be we:doc-key
      $each(node.getElements('[wedockey]'), function(element) {
        value = doc[element.get('wedockey')]
        
        if ($type(value) == 'object')
          We.view(value, function(subNode) {
            subNode.replaces(element)
          }, {tag: element.get('tag')})
        else {
          element.set('text', value)
          element.set('value', value)
        }
      })

      var $we = function(id, oNode) {
        return (oNode || node).getElement('[weid=' + id + ']')
      }
    
      var $reload = function() {
        We.reload(doc)
      }

      var $save = function(alter) {
        We.save(doc, alter)
      }

      var tasks = {0: 0}
      var lasttaskid = 0;

      var $task = function() {
        lasttaskid++
        tasks[lasttaskid] = 0
        return lasttaskid
      }

      var $taskdone = function(taskid) {
        delete tasks[taskid || 0] // default value 0 which is the one task that exists when we start this hacky task system
  
        if (!$H(tasks).some($lambda(true))) { // check if tasks object is false in a crazy hacky way
          next(node)
          We.setupBubbling(node)
        }
      }

      We.getURL(docViewUrl + '.js', function(js) {
        eval(js)
        $taskdone()
      })
    })
  },

  reload: function(doc, next) {
    var entry = this.active[doc['_object-id']]
    
    this.view(doc, function(newNode) {
      entry.doc = doc
      entry.node = newNode.replaces(entry.node)
    }, {tag: entry.node.get('tag')})
  },
  
  active: {},
  
  register: function(doc, node) {
    // $fix3: can this be done with something like php.net/compact()? maybe with an eval?
    // or actually we should wrap the arguments in an object?
    var id = doc['_object-id']
    if (!this.active[id])
      this.active[id] = {doc: doc, node: node}

    node.set('weobjectid', id)
  },

  // $fix4: comet
  checkUpdates: function() {
    $each(We.active, function(entry) {
      We.load(entry.doc['_object-id'], function(newDoc) {
        if (entry.doc['_revision-id'] != newDoc['_revision-id']) {
          We.reload(newDoc)
        }
      })
    })
  },

  display: function(id) {
    We.load(id, function(doc) {
      We.view(doc, function(node) {
        node.inject(document.body)
      })
    })
  },

  calcDepth: function(element) {
    for (var depth = 0; element != document.body; element = element.parentNode)
      if (element.get('weobjectid'))
        depth++

    return depth
  },

  getAncestor: function(element, height) {
    for (var depth = 0; element != document.body && depth < height; ) {
      element = element.parentNode;
      
      if (element.get('weobjectid'))
        depth++
    }
    
    return element
  },
  
  cleanObject: function(object) {
    var result
    
    if ($type(object) == 'object')
      result = {}
    else if ($type(object) == 'array')
      result = []
    else
      return object
    
    $each(object, function(value, index) {
      if (index != '_object-id' && index != '_revision-id' && index != '_last-revision-id')
        result[index] = We.cleanObject(value)
    })
    
    return result
  },
  
  setupBubbling: function(node) {
    node.setStyle('border', '1px solid white')
    
    node.addEvent('click', function() {
      if (We.currentSelection)
        We.currentSelection.setStyle('border', '1px solid white')
  
      if (this == We.currentElement) {
        We.currentHeight++
        We.currentHeight %= We.calcDepth(this)
      }
      else {
        We.currentElement = this
        We.currentHeight = 0
      }
  
      We.currentSelection = We.getAncestor(this, We.currentHeight)
      We.currentSelection.setStyle('border', '1px solid red')
  
      return false
    })
  }  
}

We.checkUpdates.periodical(10000)

var mainDocId = window.location.hash.substring(1)

We.display(mainDocId)

window.addEvent('domready', function() {
  window.addEvent('click', function() {
    if (We.currentSelection)
      We.currentSelection.setStyle('border', '1px solid white')
      
    We.currentElement = null
    We.currentSelection = null
  })
  
  window.addEvent('keypress', function(event) {
    if (event.alt && event.control) {
      var key = String.fromCharCode(event.event.charCode)
      
      var selectionId = We.currentSelection.get('weobjectid')
      var selectionDoc = We.active[selectionId].doc
      
      if (key == 'c') {
        We.persist.set('clipboard', selectionId)
        console.log(selectionDoc)
      }
      else if (key == 'v') {
        We.persist.get('clipboard', function(ok, val) {
          if (ok) {
            We.load(val.value, function(result) {
              We.save(selectionDoc, function(doc) {
                result["_object-id"] = doc["_object-id"]
                result["_revision-id"] = doc["_revision-id"]
                return result
              })
            })
          }
        })
      }
      else if (key == 'w') {
        We.save(selectionDoc, function(doc) {
          doc["_view"] = prompt("view")
        })
      }
    }
  })
})
  
  
