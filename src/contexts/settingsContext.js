import React, { createContext, useState, useRef, useEffect } from 'react';
import { ipcRenderer } from 'electron';

import Store from 'electron-store';
// const Store = require('electron-store');
const store = new Store();

export const SettingsContext = createContext();

const defaultSettings = {
	editorMaxWidth: 60,
	editorPadding: 5.0,
	primaryColor: '#0095ff',
	primaryColorRgb: '0, 149, 255',
	primaryColorList: ['#C61F37', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505'],
	currentFont: 'PT Sans',
	fontSize: 20,
	lineHeight: 1.15,
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
	const [fontSize, setFontSize] = useState(20);
	const [fontSettings, setFontSettings] = useState({
		currentFont: 'PT Sans',
		recentlyUsedFonts: ['PT Sans'],
	});

	// Update the CSS with new line heights
	useEffect(() => {
		const newStyleSheetRule = `
    .editor h1,
    .editor h2,
    .editor h3,
    .editor h4,
    .editor h5,
    .editor h6 {
      line-height: ${lineHeight}em;
    }`;

		// Delete the old line height css rule
		const cssRuleArray = Array.from(document.styleSheets[0].cssRules);
		const deleteIndex = cssRuleArray.findIndex(
			(item) =>
				item.selectorText ===
				'.editor h1, .editor h2, .editor h3, .editor h4, .editor h5, .editor h6'
		);
		if (deleteIndex !== -1) {
			document.styleSheets[0].deleteRule(deleteIndex);
		}

		// Insert the new rule
		const insertIndex = document.styleSheets[0].cssRules.length;
		document.styleSheets[0].insertRule(newStyleSheetRule, insertIndex);
	}, [lineHeight]);

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
			}}>
			{props.children}
		</SettingsContext.Provider>
	);
};

export default SettingsContextProvider;
