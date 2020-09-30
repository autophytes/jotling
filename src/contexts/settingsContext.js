import React, { createContext, useState, useRef, useEffect } from 'react';
import { ipcRenderer } from 'electron';

const Store = require('electron-store');
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

const SettingsContextProvider = (props) => {
	// STATE
	const [editorSettings, setEditorSettings] = useState({
		editorMaxWidth: defaultSettings.editorMaxWidth,
		editorPadding: defaultSettings.editorPadding,
		primaryColor: '#0095ff',
		primaryColorRgb: '0, 149, 255',
		primaryColorList: ['#D0021B', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505'],
	});
	const [showEditorSettings, setShowEditorSettings] = useState(false);
	const [fontList, setFontList] = useState([]);
	const [lineHeight, setLineHeight] = useState(1.15);
	const [fontSize, setFontSize] = useState(20);
	const [fontSettings, setFontSettings] = useState({
		currentFont: 'PT Sans',
		recentlyUsedFonts: ['PT Sans'],
	});

	// Initialize the values from electron-store
	useEffect(() => {
		let newEditorSettings = { ...editorSettings };

		for (let prop in editorSettings) {
			let newValue = store.get(`settings.${prop}`, null);
			console.log(newValue);
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
	}, []);

	// Synchronize the editorSettings electron-store
	useEffect(() => {
		for (let prop in editorSettings) {
			store.set(`settings.${prop}`, editorSettings[prop]);
		}
	}, [editorSettings]);

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

	return (
		<SettingsContext.Provider
			value={{
				editorSettings,
				setEditorSettings,
				showEditorSettings,
				setShowEditorSettings,
				editorContainerRef,
				editorPaddingWrapperRef,
				defaultSettings,
				fontList,
				lineHeight,
				setLineHeight,
				fontSize,
				setFontSize,
				fontSettings,
				setFontSettings,
			}}>
			{props.children}
		</SettingsContext.Provider>
	);
};

export default SettingsContextProvider;
