import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';

const Store = require('electron-store');
const store = new Store();

export const LeftNavContext = createContext();

// CONSTANTS
const DEFAULT_WIDTH = 12;

const LeftNavContextProvider = (props) => {
	// STATE
	const [docStructure, setDocStructure] = useState({});
	const [linkStructure, setLinkStructure] = useState({});
	const [project, setProject] = useState({ tempPath: '', jotsPath: '' });
	const [navData, setNavData] = useState({
		currentDoc: '',
		currentTempPath: '',
		currentTab: 'draft',
		lastClicked: { type: '', id: '' },
		editFile: '',
		parentFolders: [],
	});
	const [editorStyles, setEditorStyles] = useState({
		leftNav: DEFAULT_WIDTH,
		leftIsPinned: true,
		rightNav: DEFAULT_WIDTH,
		rightIsPinned: true,
		showAllTags: false,
		showIndTags: [],
	});
	const [editorArchives, setEditorArchives] = useState({});
	const [scrollToLinkId, setScrollToLinkId] = useState(null);
	const [peekWindowLinkId, setPeekWindowLinkId] = useState(null);

	// REFS
	const linkStructureRef = useRef(linkStructure);
	const editorStateRef = useRef(null);
	const setEditorStateRef = useRef(null);
	const scrollToLinkIdRef = useRef(null);

	useEffect(() => {
		linkStructureRef.current = linkStructure;
	}, [linkStructure]);

	// Initialize the left and right nav width from electron-store
	useEffect(() => {
		let newEditorStyles = { ...editorStyles };

		let newLeftNav = store.get(`editorStyles.leftNav`, null);
		let newRightNav = store.get(`editorStyles.rightNav`, null);

		if (newLeftNav !== null) {
			newEditorStyles.leftNav = newLeftNav;
		} else {
			newEditorStyles.leftNav = DEFAULT_WIDTH;
		}

		if (newRightNav !== null) {
			newEditorStyles.rightNav = newRightNav;
		} else {
			newEditorStyles.rightNav = DEFAULT_WIDTH;
		}

		setEditorStyles(newEditorStyles);
	}, []);

	// Synchronize the editorStyles nav widths electron-store
	useEffect(() => {
		store.set(`editorStyles.leftNav`, editorStyles.leftNav);
		store.set(`editorStyles.rightNav`, editorStyles.rightNav);
	}, [editorStyles]);

	// Resets the width of the side nav bars
	const resetNavWidth = useCallback(
		(whichNav) => {
			setEditorStyles({ ...editorStyles, [whichNav]: DEFAULT_WIDTH });
		},
		[editorStyles]
	);

	return (
		<LeftNavContext.Provider
			value={{
				docStructure,
				setDocStructure,
				navData,
				setNavData,
				project,
				setProject,
				linkStructure,
				setLinkStructure,
				editorStyles,
				setEditorStyles,
				resetNavWidth,
				editorArchives,
				setEditorArchives,
				linkStructureRef,
				editorStateRef,
				scrollToLinkId,
				setScrollToLinkId,
				scrollToLinkIdRef,
				setEditorStateRef,
				peekWindowLinkId,
				setPeekWindowLinkId,
			}}>
			{props.children}
		</LeftNavContext.Provider>
	);
};

export default LeftNavContextProvider;
