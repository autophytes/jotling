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
	const [mediaStructure, setMediaStructure] = useState({});
	const [project, setProject] = useState({ tempPath: '', jotsPath: '' });
	const [navData, setNavData] = useState({
		currentDoc: '',
		currentDocTab: 'draft',
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
		rightIsPinned: false,
		showAllTags: false,
		showIndTags: [],
	});
	const [editorArchives, setEditorArchives] = useState({});
	const [scrollToLinkId, setScrollToLinkId] = useState(null);
	const [peekWindowLinkId, setPeekWindowLinkId] = useState(null);
	const [displayWikiPopper, setDisplayWikiPopper] = useState(false);
	const [hoverSourceLinkId, setHoverSourceLinkId] = useState(null);
	const [hoverDestLinkId, setHoverDestLinkId] = useState(null);
	const [syncLinkIdList, setSyncLinkIdList] = useState([]);
	const [showUploadImage, setShowUploadImage] = useState(false);
	const [customStyles, setCustomStyles] = useState(null);

	// REFS
	const linkStructureRef = useRef(linkStructure);
	const docStructureRef = useRef(docStructure);
	const mediaStructureRef = useRef(mediaStructure);
	const editorStateRef = useRef(null);
	const editorArchivesRef = useRef(editorArchives);
	const navDataRef = useRef(navData);
	const setEditorStateRef = useRef(null);
	const scrollToLinkIdRef = useRef(null);
	const isImageSelectedRef = useRef(false);

	useEffect(() => {
		linkStructureRef.current = linkStructure;
	}, [linkStructure]);

	useEffect(() => {
		docStructureRef.current = docStructure;
	}, [docStructure]);

	useEffect(() => {
		mediaStructureRef.current = mediaStructure;
		console.log('mediaStructure in context:', mediaStructure);
	}, [mediaStructure]);

	useEffect(() => {
		navDataRef.current = navData;
	}, [navData]);

	useEffect(() => {
		editorArchivesRef.current = editorArchives;
	}, [editorArchives]);

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

	// Synchronize customStyles with the property in the docStructure
	useEffect(() => {
		let newCustomStyles = docStructure.customStyles;

		if (!newCustomStyles || !Object.keys(newCustomStyles).length) {
			return;
		}

		console.log('docStructure changed, new customStyles');

		// Update customStyles if something has changed
		setCustomStyles((prev) => {
			for (let styleType in newCustomStyles) {
				if (
					!prev ||
					!prev[styleType] ||
					prev[styleType].length !== newCustomStyles[styleType].length
				) {
					return newCustomStyles;
				}
				if (!prev[styleType].every((v, i) => v === newCustomStyles[styleType][i])) {
					return newCustomStyles;
				}
			}

			console.log('just returned previous custom style');
			return prev;
		});
	}, [docStructure]);

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
				docStructureRef,
				navData,
				setNavData,
				navDataRef,
				project,
				setProject,
				linkStructure,
				setLinkStructure,
				editorStyles,
				setEditorStyles,
				resetNavWidth,
				setEditorArchives,
				editorArchivesRef, // Nothing should monitor editorArchives
				linkStructureRef,
				editorStateRef,
				scrollToLinkId,
				setScrollToLinkId,
				scrollToLinkIdRef,
				setEditorStateRef,
				peekWindowLinkId,
				setPeekWindowLinkId,
				displayWikiPopper,
				setDisplayWikiPopper,
				hoverSourceLinkId,
				setHoverSourceLinkId,
				hoverDestLinkId,
				setHoverDestLinkId,
				syncLinkIdList,
				setSyncLinkIdList,
				showUploadImage,
				setShowUploadImage,
				mediaStructure,
				mediaStructureRef,
				setMediaStructure,
				isImageSelectedRef,
				customStyles,
			}}>
			{props.children}
		</LeftNavContext.Provider>
	);
};

export default LeftNavContextProvider;
