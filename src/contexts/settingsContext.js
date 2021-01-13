import React, { createContext, useState, useRef, useEffect } from 'react';
import { ipcRenderer } from 'electron';

import Store from 'electron-store';
// const Store = require('electron-store');
const store = new Store();

export const SettingsContext = createContext();

const defaultSettings = {
	editorMaxWidth: 65,
	editorPadding: 7.0,
	primaryColor: '#0095ff',
	primaryColorRgb: '0, 149, 255',
	primaryColorList: ['#C61F37', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505'],
	currentFont: 'PT Sans',
	fontSize: 20,
	lineHeight: 1.15,
	paragraphSpacing: 1.2,
};

const defaultHighlightColor = {
	color: '#fdffb6',
	colorList: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#bdb2ff'],
};

const defaultTextColor = {
	color: '#212529',
	colorList: ['#212529', '#066600', '#010866', '#410F70', '#660200', '#664200'],
};

const SettingsContextProvider = (props) => {
	// STATE
	const [editorSettings, setEditorSettings] = useState({
		editorMaxWidth: defaultSettings.editorMaxWidth,
		editorPadding: defaultSettings.editorPadding,
		primaryColor: '#0095ff',
		primaryColorRgb: '0, 149, 255',
		primaryColorList: ['#D0021B', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505'],
	});
	const [highlightColor, setHighlightColor] = useState(defaultHighlightColor);
	const [textColor, setTextColor] = useState(defaultTextColor);
	const [showEditorSettings, setShowEditorSettings] = useState(false);
	const [fontList, setFontList] = useState([]);
	const [lineHeight, setLineHeight] = useState(1.15);
	const [paragraphSpacing, setParagraphSpacing] = useState(1.2);
	const [fontSize, setFontSize] = useState(20);
	const [fontSettings, setFontSettings] = useState({
		currentFont: 'PT Sans',
		recentlyUsedFonts: ['PT Sans'],
	});

	// Update the CSS with new line heights
	useEffect(() => {
		const newStyleSheetRule = `{ line-height: ${lineHeight}em; }`;
		const selector = '.editor h1, .editor h2, .editor h3, .editor h4, .editor h5, .editor h6';

		updateCSSRule(newStyleSheetRule, selector);
	}, [lineHeight]);

	// Update the CSS with new line heights
	useEffect(() => {
		const newStyleSheetRule = `{ margin-bottom: ${paragraphSpacing}em; }`;
		const selector = '.public-DraftStyleDefault-block.public-DraftStyleDefault-ltr';

		updateCSSRule(newStyleSheetRule, selector);
	}, [paragraphSpacing]);

	// Initialize the values from electron-store
	useEffect(() => {
		let newEditorSettings = { ...editorSettings };
		let newHighlightColor = { ...highlightColor };
		let newTextColor = { ...textColor };

		for (let prop in editorSettings) {
			let newValue = store.get(`editorSettings.${prop}`, null);
			if (newValue !== null) {
				newEditorSettings[prop] = newValue;
			} else {
				newEditorSettings[prop] = defaultSettings[prop];
			}
		}

		// Load in our primary color
		const rootElement = document.querySelector(':root');
		rootElement.style.setProperty('--color-primary', newEditorSettings.primaryColor);
		rootElement.style.setProperty('--color-primary-rgb', newEditorSettings.primaryColorRgb);

		setEditorSettings(newEditorSettings);
		setHighlightColor(newHighlightColor);
		setTextColor(newTextColor);
	}, []);

	// Synchronize the editorSettings electron-store
	useEffect(() => {
		for (let prop in editorSettings) {
			store.set(`editorSettings.${prop}`, editorSettings[prop]);
		}
		for (let prop in highlightColor) {
			store.set(`highlightColor.${prop}`, highlightColor[prop]);
		}
		for (let prop in textColor) {
			store.set(`textColor.${prop}`, textColor[prop]);
		}
	}, [editorSettings, highlightColor, textColor]);

	// Load available fonts
	useEffect(() => {
		const fetchFonts = async () => {
			const newFontList = await ipcRenderer.invoke('load-font-list');
			setFontList(newFontList);
		};
		fetchFonts();
		console.log('ipcRenderer useEffect triggered');
	}, [ipcRenderer, setFontList]);

	// REFS
	const editorContainerRef = useRef(null);
	const editorPaddingWrapperRef = useRef(null);
	const editorHeaderPaddingWrapperRef = useRef(null);

	return (
		<SettingsContext.Provider
			value={{
				editorSettings,
				setEditorSettings,
				showEditorSettings,
				setShowEditorSettings,
				editorContainerRef,
				editorPaddingWrapperRef,
				editorHeaderPaddingWrapperRef,
				defaultSettings,
				fontList,
				lineHeight,
				setLineHeight,
				fontSize,
				setFontSize,
				fontSettings,
				setFontSettings,
				highlightColor,
				setHighlightColor,
				textColor,
				setTextColor,
				paragraphSpacing,
				setParagraphSpacing,
			}}>
			{props.children}
		</SettingsContext.Provider>
	);
};

export default SettingsContextProvider;

// Replace a CSS rule with a new one
const updateCSSRule = (newRule, selector) => {
	// Find the Jotling style sheet
	let sheetIndex = 0;
	Array.from(document.styleSheets).forEach((sheet, i) => {
		if (sheet.cssRules[0].selectorText === '.jotling-stylesheet') {
			sheetIndex = i;
		}
	});

	// Delete the old line height css rule
	console.log('document.styleSheets[0]:', document.styleSheets[sheetIndex]);
	const cssRuleArray = Array.from(document.styleSheets[sheetIndex].cssRules);
	const deleteIndex = cssRuleArray.findIndex((item) => {
		// console.log('item.selectorText: ', item.selectorText);
		return item.selectorText === selector;
	});
	if (deleteIndex !== -1) {
		document.styleSheets[sheetIndex].deleteRule(deleteIndex);
	}

	// Insert the new rule
	const insertIndex = document.styleSheets[sheetIndex].cssRules.length;
	document.styleSheets[sheetIndex].insertRule(selector + ' ' + newRule, insertIndex);
};
