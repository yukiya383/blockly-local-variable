/**
 * @license
 * Copyright 2021 yukiya383
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Builder and director which initialize below things:
 * - List
 * - Declaration block, getter/setter block
 * - Extensions for each block
 * - Callback for category
 * @module
 */

import Blockly from 'blockly';
import * as JavaScript from "blockly/javascript";
import { ArgFieldCheckbox, ArgFieldInput, ArgInputField, BlockJson, BlockWithoutOutputCodeGen, BlockWithOutputCodeGen } from 'blockly-plugin-type-blockjson';
import {constantCase} from 'constant-case';
import {noCase} from 'no-case';
import {pascalCase} from 'pascal-case';
import {snakeCase} from 'snake-case';
import { DeclarationList, Declaration } from './declaration_list';
 
/**
 * An interface to initialize DeclarationList.
 * Since most initialization processes such as registering blocks, extensions, and category callback
 * are only necessary in initialization, they are done by Builder.
 * In most cases, you can use {@link DeclarationListBuilder} which implements this interface.
 */
export interface IDeclarationListBuilder {
  /**
   * Add primitives to {@link DeclarationList}.
   * @param list List of primitives.
   */
  addInitialValues(list:Declaration[]):void;
  /**
   * Initialize declaration block.
   */
  initDeclarationBlock_():void;
  /**
   * Initialize getter block.
   */
  initGetter_():void;
  /**
   * Initialize setter block.
   */
  initSetter_():void;
  /**
   * Initialize extensions.
   */
  initExtensions_():void;
  /**
   * Initialize category callback.
   * @param workspace Your workspace to which category callback is registerd.
   */
  initCategory_(workspace:Blockly.WorkspaceSvg):void;
  /**
   * Get initialized declaration list.
   */
  getResult():DeclarationList;
}

/**
 * Implementation of {@link IDeclarationListBuilder}.
 * Since there's many fields used only for initialization, I recommend using or extending this class.
 */
export class DeclarationListBuilder implements IDeclarationListBuilder {
  constructor(public readonly name:string){
    this.list = new DeclarationList();
    this.TYPE_NAME_DECLARATION_BLOCK_ = pascalCase(name)+"Declaration";
    this.TYPE_NAME_GETTER_ = pascalCase(name)+"Getter";
    this.TYPE_NAME_SETTER_ = pascalCase(name)+"Setter";
    this.EXTENSION_NAME_DECLARATION_ = snakeCase(name)+"_declaration_extension";
    this.EXTENSION_NAME_MENU_ = snakeCase(name)+"_menu_extension";
    this.CATEGORY_NAME_ = constantCase(name);
    this.TOOLTIP_DECLARATION = `Define ${noCase(name)}.`;
    this.xmlList = [
      Blockly.Xml.textToDom(`<block type="${this.TYPE_NAME_DECLARATION_BLOCK_}"/>`)
    ];
  }

  /**
   * List to initialize.
   */
  protected list:DeclarationList;

  /**
   * Category default values.
   * By default, only declaration block are registered.
   */
  protected xmlList:Element[];

  /**
   * Type of variable.
   */
  protected type:string|null = null;
  /**
   * If true, setter block will be registered.
   */
  protected isAlwaysReadonly:boolean = false;
  /**
   * If true, declaration block will have checkbox
   * which define whether declared variable can be re-assigned.
   */
  protected hasReadonlyCheckbox:boolean = true;
  
  protected readonly TYPE_NAME_DECLARATION_BLOCK_: string;
  protected readonly TYPE_NAME_GETTER_ : string;
  protected readonly TYPE_NAME_SETTER_ : string;
  protected readonly EXTENSION_NAME_DECLARATION_: string;
  protected readonly EXTENSION_NAME_MENU_ : string;
  protected readonly CATEGORY_NAME_ : string;
  
  protected MESSAGE_BASE : string = "def";
  protected DEFAULT_TEXT_DECLARATION : string = "ITEM";
  protected TOOLTIP_DECLARATION : string;
  protected KEYWORD_CONST : string = "const";
  protected KEYWORD_VARIABLE : string = "let";
  protected COLOUR : string = "%{BKY_VARIABLES_HUE}";
  
  setType(type: string) {
    this.type = type;
    return this;
  }
  setAlwaysReadonly(isAlwaysReadonly: boolean) {
    this.isAlwaysReadonly = isAlwaysReadonly;
    return this;
  }
  setReadonlyCheckbox(hasReadonlyCheckbox: boolean) {
    this.hasReadonlyCheckbox = hasReadonlyCheckbox;
    return this;
  }
  setMessageBase(messageBase: string) {
    this.MESSAGE_BASE = messageBase;
    return this;
  }
  setDefaultTextForDeclaration(defaultTextForDeclaration: string) {
    this.DEFAULT_TEXT_DECLARATION = defaultTextForDeclaration;
    return this;
  }
  setTooltipForDeclaration(tooltipForDeclaration: string) {
    this.TOOLTIP_DECLARATION = tooltipForDeclaration;
    return this;
  }
  setKeywordForConstant(keywordForConstant: string) {
    this.KEYWORD_CONST = keywordForConstant;
    return this;
  }
  setKeywordForVariable(keywordForVariable: string) {
    this.KEYWORD_VARIABLE = keywordForVariable;
    return this;
  }
  setColour(colour: string) {
    this.COLOUR = colour;
    return this;
  }
  
  addCategoryDefaultElements(xmlList:Element[]){
    this.xmlList.push(...xmlList);
    return this;
  }

  addInitialValues(list:Declaration[]) {
    this.list.addInitialListValues(list);
  }

  initGetter_(){
    const getterBlock:BlockJson = {
      type: this.TYPE_NAME_GETTER_,
      message0: "%1",
      args0: [
        {
          "type": "input_dummy",
          "name": "INPUT"
        }
      ],
      output: this.type,
      colour: this.COLOUR,
      extensions: [this.EXTENSION_NAME_MENU_]
    };
    Blockly.defineBlocksWithJsonArray([getterBlock]);
    
    const getterBlockCode: BlockWithOutputCodeGen = (block:Blockly.Block) => {
      const id:string = block.getFieldValue("name");
      const block_ = block.workspace.getBlockById(id);
      const name:string = block_?block_.getFieldValue("name"):id; //Renameされてても反映する(getterブロック自体には反映されない)
      return [`${name}`, JavaScript.ORDER_ATOMIC];
    }
    JavaScript[this.TYPE_NAME_GETTER_] = getterBlockCode;
  }

  initSetter_(){
    const setterBlock:BlockJson = {
      type: this.TYPE_NAME_SETTER_,
      message0: "%1",
      args0: [
        {
          "type": "input_dummy",
          "name": "INPUT"
        },
      ],
      message1: "%1",
      args1: [
        {
          "type": "input_value",
          "name": "VALUE",
          "check": this.type?this.type:undefined
        }
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: this.COLOUR,
      extensions: [this.EXTENSION_NAME_MENU_]
    };
    Blockly.defineBlocksWithJsonArray([setterBlock]);
    const setterBlockCode:BlockWithoutOutputCodeGen = (block:Blockly.Block) => {
      const id = block.getFieldValue("name");
      const name = block.workspace.getBlockById(id).getFieldValue("name"); //Renameされてても反映する(getterブロック自体には反映されない)
      const value = JavaScript.valueToCode(block, "VALUE", JavaScript.ORDER_ASSIGNMENT);
      return `${name} = ${value};\n`;
    }
    JavaScript[this.TYPE_NAME_SETTER_] = setterBlockCode;
  }
  
  initDeclarationBlock_(){
    if(this.isAlwaysReadonly||!this.hasReadonlyCheckbox){
      const declarationBlock:BlockJson = {
        type: this.TYPE_NAME_DECLARATION_BLOCK_,
        message0: `${this.MESSAGE_BASE} %1 : %2`,
        args0: [
          {
            type:"field_input",
            name:"name",
            text:this.DEFAULT_TEXT_DECLARATION
          },
          {
            type:"input_value",
            name:"value",
            check: this.type?this.type:undefined//"Type"
          }
        ],
        inputsInline: false,
        previousStatement: null,
        nextStatement: null,
        colour: this.COLOUR,
        tooltip: this.TOOLTIP_DECLARATION,
        extensions: [this.EXTENSION_NAME_DECLARATION_],
      };
      Blockly.defineBlocksWithJsonArray([declarationBlock]);
    } else {
      type DeclarationBlockWithCheckbox = BlockJson & {
        args0: [ArgFieldCheckbox]
        args1: [ArgFieldInput, ArgInputField]
      };
  
      const declarationBlock:DeclarationBlockWithCheckbox = {    // return(<>...</>)
        type: this.TYPE_NAME_DECLARATION_BLOCK_,
        message0: "readonly:%1",
        args0: [
          {
            type:"field_checkbox",
            name:"readonly",
            checked: true
          }
        ],
        message1: `${this.MESSAGE_BASE} %1 : %2`,
        args1: [
          {
            type:"field_input",
            name:"name",
            text:this.DEFAULT_TEXT_DECLARATION
          },
          {
            type:"input_value",
            name:"value",
            check: this.type?this.type:undefined
          }
        ],
        inputsInline: false,
        previousStatement: null,
        nextStatement: null,
        colour: this.COLOUR,
        tooltip: this.TOOLTIP_DECLARATION,
        extensions: [this.EXTENSION_NAME_DECLARATION_],
      };
      Blockly.defineBlocksWithJsonArray([declarationBlock]);
    }
    const declarationBlockCode = (block:Blockly.Block)=>{
      const name:string = block.getFieldValue('name')||"";
      const isReadonly:boolean = block.getFieldValue('readonly')!=='FALSE';
      const value = JavaScript.valueToCode(block, 'value', JavaScript.ORDER_ASSIGNMENT)||"";
      return `${isReadonly?this.KEYWORD_CONST:this.KEYWORD_VARIABLE} ${name}${value?` = ${value}`:""};\n`;
    }
    JavaScript[this.TYPE_NAME_DECLARATION_BLOCK_] = declarationBlockCode;
  }

  initExtensions_(){
    const this_ = this;
    function declarationExtension(this:Blockly.Block){
      this_.list.declare(this);
    }
    Blockly.Extensions.unregister(this.EXTENSION_NAME_DECLARATION_);
    Blockly.Extensions.register(this.EXTENSION_NAME_DECLARATION_,declarationExtension);

    Blockly.Extensions.unregister(this.EXTENSION_NAME_MENU_);
    function ConstantMenuExtensionImpl(this:Blockly.Block) {
      const FIELD = this_.stackDropdownMenuImpl_(this);
      if(FIELD){
        this?.getInput('INPUT')
          .appendField(FIELD, 'name');
      }
    };
    Blockly.Extensions.register(this.EXTENSION_NAME_MENU_,ConstantMenuExtensionImpl);
  }
  
  stackDropdownMenuImpl_(block:Blockly.Block) {
    return new Blockly.FieldDropdown(() => {
      let options:Array<[string,string]> = [];
      const stack = this.list.getAccessibleDeclarations(block);
      const isSetter:boolean = block.getOutputShape()!==null;
      stack.forEach(({id,wid,name})=>{
        if(id==="" && name){
          options.push([name,name]);
        } else {
          const block_ = Blockly.Workspace.getById(wid).getBlockById(id);
          if(block_!==null && (this.isAlwaysReadonly||!isSetter||block_.getFieldValue("readonly")!=='FALSE')){
            const name = block_.getFieldValue("name");
            options.push([name, id]);
          }
        }
      });
      return options;
    });
  };
  
  /**
   * カテゴリの中身を再生成
   * ついでに消した定数をスタックから消去
   * @package
   */
  categoryCallback_ = () => {
    let xmlList = this.xmlList.slice();
    if (Blockly.Blocks[this.TYPE_NAME_GETTER_]) {
      xmlList.push(...this.list.getCategoryXML(this.TYPE_NAME_GETTER_));
      /*const obsolete:number[] = [];
      this.list.forEach(({id, wid, name},i)=>{
        if(id==="" && name){
          const blockText = `<block type="${this.TYPE_NAME_GETTER_}"><field name="name">${name}</field></block>`;
          const block = Blockly.Xml.textToDom(blockText);
          xmlList.push(block);
        } else {
          const _block = Blockly.Workspace.getById(wid).getBlockById(id);
          if(_block){
            const blockText = `<block type="${this.TYPE_NAME_GETTER_}"><field name="name">${id}</field></block>`;
            const block = Blockly.Xml.textToDom(blockText);
            xmlList.push(block);
          } else {
            obsolete.push(i);
          }
        }
      }, this);
      obsolete.forEach((i)=>{this.list.splice(i,1)});*/
      if(!this.isAlwaysReadonly){
        xmlList.push(...this.list.getCategoryXML(this.TYPE_NAME_SETTER_,
            (block)=>block&&block.getFieldValue("readonly")==='FALSE'));
      }
    }
    return xmlList;
  }
  
  public initCategory_(workspace:Blockly.WorkspaceSvg) {
    workspace.removeToolboxCategoryCallback(this.CATEGORY_NAME_);
    workspace.registerToolboxCategoryCallback(this.CATEGORY_NAME_,this.categoryCallback_);
  };

  public getResult():DeclarationList {
    return this.list;
  }
}

/**
 * Director which construct declaration list using given builder.
 */
export class DeclarationListDirector<Builder extends IDeclarationListBuilder> {
  constructor(private builder:Builder) {}

  public construct(workspace:Blockly.WorkspaceSvg){
    this.builder.initDeclarationBlock_();
    this.builder.initGetter_();
    this.builder.initSetter_();
    this.builder.initExtensions_();
    this.builder.initCategory_(workspace);
    return this.builder.getResult();
  }
}