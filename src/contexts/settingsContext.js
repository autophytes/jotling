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
	backdropColor: '#f6f5f3',
	currentFont: 'PT Sans',
	fontSize: 20,
	lineHeight: 1.15,
	paragraphSpacing: 1.2,
};

const defaultHighlightColor = {
	color: '#fdffb6',
	defaultColorList: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#bdb2ff'],
	userColorList: [],
};

const defaultTextColor = {
	color: '#212529',
	defaultColorList: ['#212529', '#066600', '#010866', '#410F70', '#660200', '#664200'],
	userColorList: [],
};

const defaultLineHeight = 1.15;
const defaultParagraphSpacing = 1.2;
const defaultFontSize = 20;
const defaultFontSettings = {
	currentFont: 'PT Sans',
	recentlyUsedFonts: ['PT Sans'],
};

const SettingsContextProvider = (props) => {
	// STATE
	const [editorSettings, setEditorSettings] = useState({
		editorMaxWidth: defaultSettings.editorMaxWidth,
		editorPadding: defaultSettings.editorPadding,
		backdropColor: '#f6f5f3',
		primaryColor: '#0095ff',
		primaryColorRgb: '0, 149, 255',
		primaryColorList: ['#D0021B', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505'],
	});
	const [highlightColor, setHighlightColor] = useState(defaultHighlightColor);
	const [textColor, setTextColor] = useState(defaultTextColor);
	const [showEditorSettings, setShowEditorSettings] = useState(false);
	const [fontList, setFontList] = useState([]);
	const [lineHeight, setLineHeight] = useState(defaultLineHeight);
	const [paragraphSpacing, setParagraphSpacing] = useState(defaultParagraphSpacing);
	const [fontSize, setFontSize] = useState(defaultFontSize);
	const [fontSettings, setFontSettings] = useState(defaultFontSettings);

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

		for (let prop in editorSettings) {
			let newValue = store.get(`editorSettings.${prop}`, null);
			if (newValue !== null) {
				newEditorSettings[prop] = newValue;
			} else {
				newEditorSettings[prop] = defaultSettings[prop];
			}
		}

		// const newHighlightColor = {
		// 	...highlightColor,
		// 	...store.get(`highlightColor`, {}),
		// };
		// const newTextColor = {
		// 	...textColor,
		// 	...store.get(`textColor`, {}),
		// };

		// Load in our primary color
		const rootElement = document.querySelector(':root');
		rootElement.style.setProperty('--color-primary', newEditorSettings.primaryColor);
		rootElement.style.setProperty('--color-primary-rgb', newEditorSettings.primaryColorRgb);
		rootElement.style.setProperty('--color-backdrop', newEditorSettings.backdropColor);

		setEditorSettings(newEditorSettings);
		setHighlightColor(store.get('highlightColor', defaultHighlightColor));
		setTextColor(store.get('textColor', defaultTextColor));

		setLineHeight(store.get('lineHeight', defaultLineHeight));
		setParagraphSpacing(store.get('paragraphSpacing', defaultParagraphSpacing));
		setFontSize(store.get('fontSize', defaultFontSize));
	}, []);

	// Synchronize the editorSettings electron-store
	useEffect(() => {
		for (let prop in editorSettings) {
			store.set(`editorSettings.${prop}`, editorSettings[prop]);
		}

		store.set('highlightColor', highlightColor);
		store.set('textColor', textColor);
		store.set('lineHeight', lineHeight);
		store.set('paragraphSpacing', paragraphSpacing);
		store.set('fontSize', fontSize);
	}, [
		editorSettings,
		highlightColor,
		textColor,
		lineHeight,
		paragraphSpacing,
		fontSize,
		fontSettings,
	]);

	// Load available fonts
	useEffect(() => {
		const fetchFonts = async () => {
			const newFontList = await ipcRenderer.invoke('load-font-list');
			setFontList(newFontList);
		};
		fetchFonts();
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
