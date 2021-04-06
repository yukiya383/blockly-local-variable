/**
 * @license
 * Copyright 2021 yukiya383
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A list which contains declarations.
 * @module
 */

import Blockly from 'blockly';
/**
 * Element type.
 */
export type Declaration = {
  /** ID of corresponding block. */
  id:string;
  /** ID of workspace where corresponding block exists. */
  wid:string;
  /** Additional property used for primitives which have no declaration block. */
  name?:string;
};
  
/**
 * List of something dynamically generated by a declaration block.
 * Typical example is local variable.
 */
export class DeclarationList{
  protected list:Declaration[] = [];

  /**
   * Add primitives.
   * @param list List of primitives.
   */
  public addInitialListValues(list:Declaration[]) {
    this.list = this.list.concat(list);
  }
  
  /**
   * Get a list of elements whose scope includes given block.
   * @param block A block accessing elements, getter or setter.
   * @returns List of elements accessible.
   * @package
   */
  getAccessibleDeclarations(block:Blockly.Block):Declaration[]{
    let result:Array<Declaration> = [];
    let parent=block.getParent();
    if(parent===null){
      return this.list;
    }
    const max_iter = 100;
    let iter;
    for(iter=0;iter<max_iter;iter++){
      const blocks = parent ? parent.getChildren(true) : block.workspace.getTopBlocks(true);
      const index = blocks.indexOf(block);
      const vars = blocks.filter((b,i)=>{
        return (i<=index||index===-1) && this.list.find(value=>value.id===b.id);
      }).map((b)=>{return{id:b.id,wid:b.workspace.id};});
      result.push(...vars);
      block=parent;
      if(block==null) break;
      parent=block.getParent();
    }
    if(iter>=max_iter) {
      return this.list;
    }
    return result;
  };
  
  /**
   * Declare new block, used by extension.
   * @param block 
   * @package
   */
  declare(block:Blockly.Block) {
    if(!block||block.isInFlyout) return;
    const workspace = block.workspace;
    if(!workspace) return;
    const name = block.getFieldValue("name");
    if(this.list.find(({id})=>id===block.id)) return;
    const samename = this.list.find(({id})=>{
      const _block = workspace.getBlockById(id);
      return _block!==null && _block.getFieldValue("name")===name;
    });
    if(samename&&false){
      /*
      if(samename.id!==_this.id){
        _this.dispose(true);
        console.error(`constant ${name} already exists.`);
      }*/
    } else {
      this.list.push({id:block.id, wid:workspace.id});
    }
  };

  /**
   * @param typeName Type of each block.
   * @param filter Whether an element should be included.
   *    Passed argument will be the corresponding declaration block.
   *    By default, any existing block(non-null block) will be allowed.
   * @returns XML element list for category callback.
   * @package
   */
  getCategoryXML(typeName:string, filter:(block:Blockly.Block)=>boolean=(block)=>block!=null):Element[]{
    let xmlList:Element[] = [];
    this.list.forEach(({id, wid, name})=>{
      if(id==="" && name){
        const blockText = `<block type="${typeName}"><field name="name">${name}</field></block>`;
        const block = Blockly.Xml.textToDom(blockText);
        xmlList.push(block);
      } else {
        const _block = Blockly.Workspace.getById(wid).getBlockById(id);
        if(filter(_block)){
          const blockText = `<block type="${typeName}"><field name="name">${id}</field></block>`;
          const block = Blockly.Xml.textToDom(blockText);
          xmlList.push(block);
        }
      }
    }, this);
    return xmlList;
  }
}
