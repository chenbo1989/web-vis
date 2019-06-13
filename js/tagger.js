let Tagger = (function(){
  let $ = window.$ || {
    trim: function(s){
      return s.trim()
    },
    isArray: function(v){
      return typeof v === "object" && "length" in v;
    }
  }

function isWordLetter(s){
    var regex = /[a-zA-Z\-_0-9]{1}/g;
    return regex.test(s);
    //var c = s.charCodeAt(0);
    if(s>="A" && s<="Z") return true;
    if(s>="a" && s<="z") return true;
    if(s=="-" || s=="_") return true;
    return false;
}

function isEnglish(s){
    for(var i=0; i<s.length; ++i){
        if(s.charCodeAt(i)>255) return false;
    }
    return true;
}

function isBorder(i,j, s){
    if(i<=0 && j>=s.length) return true;
    var s1 = s.substr(i-1, 1);
    var s2 = s.substr(j, 1);
    if(!isWordLetter(s1) && !isWordLetter(s2)) return true;
    return false;
}

function getTexts(node, arr){
	if(node.nodeType==3) {
		arr.push({p:node.parentNode, node:node, text:node.nodeValue});
	}
	else if(node.nodeType==1) {
	   for(var child = node.firstChild; !!child; child = child.nextSibling){
		  getTexts(child, arr);
	   }
	}
}

function getTextsEsc0(node, arr){
	if(node.nodeType==3 && node.parentNode.nodeName!="ENT") {
		arr.push({p:node.parentNode, node:node, text:node.nodeValue});
	}
	else if(node.nodeType==1) {
	   for(var child = node.firstChild; !!child; child = child.nextSibling){
		    getTextsEsc0(child, arr);
	   }
	}
}

function getTextsEsc(node){
  let arr = []
  getTextsEsc0(node, arr)
  return arr
}

function hilightTexts(src, text, hiclass){
    if(!text || text.length==0) return src;
    var arr = [];
    var i = 0;
    hiclass = hiclass || 'red';
    while(i<src.length){
      var pos = src.indexOf(text, i);
      if(pos<i) {
        arr.push(src.substring(i));
		break;
      }
      if(pos>i){
        arr.push(src.substring(i,pos));
      }
      arr.push('<span class="'+ hiclass+'">');
      arr.push(text);
      arr.push('</span>');
      i = pos + text.length;
    }
    return arr.join('');
}


/**
  find text and select it in DOM
 **/
 function findSelect(win, search, view, restart){
	if(restart){
		win.getSelection().removeAllRanges();
	}
	if(!win.find(search,false,true,true) && search.length > 10){
	    search = search.substr(0,10);
	    if(!win.find(search,false,true,true)){
		return null;
	    }
	}
	var node = win.getSelection().anchorNode;
	if(node) {
		var select = node.parentElement;
		if(view) select.scrollIntoViewIfNeeded();
		return select;
	}
	return null;
}

  function tagEntsSeg(seg, ents, pos){
     if(seg=="" || pos>=ents.length) return [{t:seg}];
     var ent = ents[pos];
     var tag = ent.label;
     var i = seg.indexOf(tag);
     if(ent.lang_en && !isBorder(i, i+tag.length, seg)) i = -1;
     if(i<0) return tagEntsSeg(seg, ents, pos+1);
      var arr = [];
      if(i>0) arr = arr.concat(tagEntsSeg(seg.substring(0,i), ents, pos+1));
      var cur = {n:tag};
      if(ent.id) cur.id = ent.name;
      if(ent.type) cur.type = ent.type;
      arr.push(cur);
      if(i+tag.length<seg.length) arr = arr.concat(tagEntsSeg(seg.substring(i+tag.length), ents, pos+1));
      return arr;
  }

  function replaceText(p, node, segs, clz){
    var cNode = document.createElement("ents");
    p.appendChild(cNode);
    p.replaceChild(cNode, node);
    segs.forEach(function(item, i){
      if(item.t) {
        var tn = document.createTextNode(item.t);
        cNode.appendChild(tn);
      }
      else if(item.n){
        var en = document.createElement("ent");
        en.appendChild(document.createTextNode(item.n));
        en.setAttribute("class", item.type || clz || 'ent')
        if(item.id) en.setAttribute('data-entid', item.id);
        cNode.appendChild(en);
      }
    });
  }

  function tagBody(node, ents, clz){
      if(!ents || ents.length==0) return;
      ents.sort(function(a, b){//sort by length desc
          return b.label.length - a.label.length;
      });
      let arr = getTextsEsc(node);
      arr.forEach(function(seg){
          var t = $.trim(seg.text);//.replace(/\s+/g,'');
          if(t=='') return;
          var segs = tagEntsSeg(t, ents, 0);
          if(segs.length==1 && segs[0].t) return;//no need
          replaceText(seg.p, seg.node, segs, clz || '');
      });
  }

  return {findSelect, hilightTexts, tagBody}

})();