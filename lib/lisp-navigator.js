'use babel';

import LispNavigatorView from './lisp-navigator-view';
import { CompositeDisposable } from 'atom';
import { Point, TextEditor } from 'atom'


export default {

  lispNavigatorView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.lispNavigatorView = new LispNavigatorView(state.lispNavigatorViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.lispNavigatorView.getElement(),
      visible: false
    });

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'lisp-navigator:toggle': () => this.toggle()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'lisp-navigator:test': () => this.test()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'lisp-navigator:root': () => this.root()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'lisp-navigator:parent': () => this.parent()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'lisp-navigator:leftSibling': () => this.leftSibling()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'lisp-navigator:child': () => this.child()
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'lisp-navigator:rigthSibling': () => this.rigthSibling()
    }));

  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.lispNavigatorView.destroy();
  },

  //saves package between uses
  serialize() {
    return {
      lispNavigatorViewState: this.lispNavigatorView.serialize()
    };
  },

  move(p_row, p_column){
    const row = p_row;
    const column = p_column;
    const editor = atom.workspace.getActiveTextEditor()

    const position = new Point(row, column)
    editor.setCursorBufferPosition(position)
    editor.unfoldBufferRow(row)
    if (column < 0) {
      editor.moveToFirstCharacterOfLine()
    }
    editor.scrollToBufferPosition(position, {
      center: true
    })

  },

  toggle(){
    //this is the function that activates the plugin
  },

  root(){
    //go to root
    try {
      this.move(this.find("root").getDefLine, 0)
    }
    catch(err) {
    }
  },

  parent(){
    //go to parent
    try {
      this.move(this.find("node").getParent.getDefLine, 0)
    }
    catch(err) {
    }
  },

  child(){
    //go to child
    try {
      this.move(this.find("node").getChild.getDefLine, 0)
    }
    catch(err) {
    }
  },

  rigthSibling(){
    //go to sibling right
    try {
      this.move(this.find("node").getRightSibling.getDefLine, 0)
    }
    catch(err) {
    }
  },

  leftSibling(){
    //go to sibling left
    try {
      this.move(this.find("node").getLeftSibling.getDefLine, 0)
    }
    catch(err) {
    }
  },

  //this finds the node the user is currently in
  //unless the method is root where it returns the root
  find(method) {
    //the atom workspace
    let editor

    //list of all the labled functions
    let labledFunctions = []
    //list of all the labled functions names
    let labledKeys = []
    //List of where functions are positioned
    let functionPositons = []
    let functionNode = []
    let root = -1
    let currentNode = -1
    let nodeCtr = 0;

    //if editor exists
    if (editor = atom.workspace.getActiveTextEditor()) {
      //grab all the text inside it
      let allText = editor.getText()
      //Get the cursor postiotion
      let cursor = atom.workspace.getActiveTextEditor().getCursorBufferPosition()

      //this stuff is used to track the lisp syntax
      let inString = false
      let bracketCount = 0
      let labeling = false

      //split all the the editor text by line
      let lines = allText.split("\n")

      //for each line
      for (i = 0; i < lines.length; i++) {
        //split by characters
        chars = lines[i].split("")
        //for each character
        for (j = 0; j < chars.length; j++) {

          //skip comments
          if(chars[j] == ";"){
            j = chars.length
          }
          //skip strings
          else if(chars[j] == "\""){
            inString = !inString
          }
          //If it isn't in a string
          else if(inString == false){

            //if in the labling section of lisp
            //by tracking the brakets you can find the next function definition
            if(labeling){
              if(chars[j] == "("){
                bracketCount++
                //two brakets means it is the next function definition
                if(bracketCount == 2){

                  //split the line again by word to get the function name
                  key = lines[i].substr(j+1).trim().split(" " || "(")[0]
                  //record where the defintion is and its assciated node
                  labledFunctions.push(nodeCtr)
                  labledKeys.push(key)
                  //add in the next position
                  functionPositons.push(i)
                  //add in the next node
                  functionNode.push(new Node(i))
                  nodeCtr++
                }
              }
              else if(chars[j] == ")"){
                bracketCount--
                //if its 0 we know its the end of the labeling
                if(bracketCount == 0){
                  labeling = false
                }
              }
            }

            //if not labling
            else if(chars[j] == "("){
              //sets up the root node which should be the first line
              if(currentNode == -1){
                //sets up function node
                nodeCtr++
                root = 0
                currentNode = 0
                functionPositons.push(i)
                functionNode.push(new Node(i))

                //returns the root if that is what was requested
                if(method == "root"){
                  return functionNode[root]
                }

                //skip the paraters and function name
                while(chars[j] != ")"){
                  if(j+1<chars.length){
                    j++
                  }
                  else{
                    j=0
                    i++
                    chars = lines[i].split("")
                  }
                }
              }

              //if not last line
              else if(i+1<lines.length){
                //find lableing function
                if(j+1 == chars.length){
                  j=0
                  i++
                  chars = lines[i].split("")
                }
                word = lines[i].substr(j+1).trim().split(" " || "(")[0]
                if(word == "labels"){
                  labeling = true

                }

                //if there was not lableing function
                else{
                  //find all of the functions in the roots definition
                  //split line
                  tempWords = lines[i].substr(j+1).replace(/\(/g," ").replace(/\)/g," ").trim().split(/[\s,]+/)
                  for(k = 0; k < tempWords.length; k++){
                    //if it exits
                    if(labledKeys.includes(tempWords[k])){
                      //add it
                      functionNode[root].child = functionNode[labledFunctions[labledKeys.indexOf(tempWords[k])]]
                    }
                  }
                  //end line
                  j = chars.length
                }
              }
            }
          }
        }
      }

      //Now that the inital root is set up the function tree is built
      for(i = 1; i+1 < functionPositons.length; i++){
        //for each of the functions go through the lines until the next defintion
        for(j = functionPositons[i]; j < functionPositons[i+1]; j++){

          //break the line into words
          tempLine = lines[j]
          tempLine = tempLine.replace(/\(/g," ").replace(/\)/g," ")
          tempLine = tempLine.trim()
          tempWords = tempLine.split(/[\s,]+/)
          //check each of the words
          for(k = 0; k < tempWords.length; k++){
            //igonring comments
            if(tempWords[k].startsWith(";")){
              k = tempWords.length
            }
            //if the function includes another funtion
            //this also check if the node called is the same as this one
            //this should be adapted later to account for recursion
            else if(labledKeys.includes(tempWords[k]) && i != labledFunctions[labledKeys.indexOf(tempWords[k])]){
              //add other funtion as a child
              functionNode[i].child = functionNode[labledFunctions[labledKeys.indexOf(tempWords[k])]]
            }
          }
        }
      }

      //finding which function the courser is in
      for(i = 1; i < functionPositons.length; i++){
        if(functionPositons[i]>cursor.row){
          return functionNode[i-1]
        }
      }
      //this there is more then 1 function the it must be the last one
      if(functionPositons.length>0){
        return functionNode[functionPositons.length-1]
      }

      return null
    }
  },

}

//This class handles structuring the function tree
class Node{
  constructor(defLine) {
    //this stores where the function is defined
    this._defLine = defLine

    //these store the nodes that this one is related too
    this._parent = null
    this._leftSibling = null
    this._rightSibling = null
    this._child = null
  }

  //sets the parent
  set parent(node) {
    this._parent = node
  }

  //sets the child of this node
  set child(node) {
    //set the childs parent to this node
    node.parent = this

    //checks if the child already exists
    if(this._child == node){
    }
    //add the new node if its the first child
    else if(this._child == null){
      this._child = node
    }
    //add the new node if it isn't the first child
    else{
      //set the node as the right sibling of this ones child
      this._child.rightSibling = node
    }

  }

  //Sets the sibling relations
  set rightSibling(node) {
    //check if the node already exists as the right sibling
    if(this._rightSibling == node){

    }
    //if there is not right sibling
    else if(this._rightSibling == null){
      //set this node's sibling
      this._rightSibling = node
      //set the new nodes lift sibling to this
      this._rightSibling.leftSibling = this
    }
    //if this node already has a right sibling
    else{
      //set this nodes right sibling to the next node
      this._rightSibling.rightSibling = node
    }
  }
  //sets leftnode
  set leftSibling(node){
    this._leftSibling = node
  }

  //all of these just get data from the nodes
  get getParent() {
    return this._parent
  }
  get getChild() {
    return this._child
  }
  get getLeftSibling() {
    return this._leftSibling
  }
  get getRightSibling() {
    return this._rightSibling
  }
  get getDefLine() {
    return this._defLine
  }

}
