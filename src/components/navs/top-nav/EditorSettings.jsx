import React, {
	useEffect,
	useState,
	useContext,
	useLayoutEffect,
	useRef,
	useCallback,
} from 'react';

import { SettingsContext } from '../../../contexts/settingsContext';

import PopperContainer from '../../containers/PopperContainer';
import ResizableWindow from '../../containers/ResizableWindow';

import { SketchPicker, ChromePicker } from 'react-color';

const EditorSettings = () => {
	// CONTEXT
	const {
		editorSettings,
		setEditorSettings,
		setShowEditorSettings,
		editorContainerRef,
		editorPaddingWrapperRef,
		defaultSettings,
	} = useContext(SettingsContext);

	// STATE
	const [editorPadding, setEditorPadding] = useState(editorSettings.editorPadding);
	const [editorMaxWidth, setEditorMaxWidth] = useState(editorSettings.editorMaxWidth);
	const [showAccentPicker, setShowAccentPicker] = useState(false);
	const [primaryColor, setPrimaryColor] = useState('');

	// REFS
	const colorSwatchRef = useRef(null);

	// UPDATE
	const closeFn = useCallback(() => {
		setShowEditorSettings(false);
	}, []);

	useEffect(() => {
		let newPrimary = getComputedStyle(document.querySelector(':root')).getPropertyValue(
			'--color-primary'
		); // #999999

		setPrimaryColor(newPrimary);
	}, []);

	// Editor Padding Change
	const handlePaddingChange = (e) => {
		editorPaddingWrapperRef.current.style.padding = `0 ${e.target.value}rem`;
		setEditorPadding(e.target.value);
	};

	// Editor Padding Mouse Up
	const handlePaddingMouseUp = (e) => {
		setEditorPadding(e.target.value);
		setEditorSettings({
			...editorSettings,
			editorPadding: e.target.value,
		});
	};

	// Editor Max Width Change
	const handleMaxWidthChange = (e) => {
		editorContainerRef.current.style.maxWidth = `${e.target.value}rem`;
		setEditorMaxWidth(e.target.value);
	};

	// Editor Max Width Mouse Up
	const handleMaxWidthMouseUp = (e) => {
		setEditorMaxWidth(e.target.value);
		setEditorSettings({
			...editorSettings,
			editorMaxWidth: e.target.value,
		});
	};

	// Reset to default on double click
	const handleDoubleClick = (propName) => {
		setEditorSettings({
			...editorSettings,
			[propName]: defaultSettings[propName],
		});

		// Set the local state
		switch (propName) {
			case 'editorPadding':
				setEditorPadding(defaultSettings[propName]);
				break;
			case 'editorMaxWidth':
				setEditorMaxWidth(defaultSettings[propName]);
				break;
			default:
		}
	};

	return (
		<>
			<ResizableWindow windowTitle='Editor Settings' closeFn={closeFn}>
				<div className='editor-settings-wrapper'>
					{/* EDITOR PADDING */}
					<p className='settings-category-title'>Page Margin</p>
					<div className='settings-range-slider-wrapper'>
						<input
							className='settings-range-slider'
							type='range'
							value={editorPadding}
							min='0.0'
							max='10.0'
							step='0.1'
							onChange={handlePaddingChange}
							onMouseUp={handlePaddingMouseUp}
							onDoubleClick={() => handleDoubleClick('editorPadding')}
						/>
						<input
							className='settings-range-number-input'
							type='number'
							value={editorPadding}
							onChange={handlePaddingMouseUp}
						/>
					</div>

					{/* EDITOR MAX WIDTH */}
					<p className='settings-category-title'>Page Width</p>
					<div className='settings-range-slider-wrapper'>
						<input
							className='settings-range-slider'
							type='range'
							value={editorMaxWidth}
							min='0.0'
							max='120.0'
							step='0.1'
							onChange={handleMaxWidthChange}
							onMouseUp={handleMaxWidthMouseUp}
							onDoubleClick={() => handleDoubleClick('editorMaxWidth')}
						/>
						<input
							className='settings-range-number-input'
							type='number'
							value={editorMaxWidth}
							onChange={handleMaxWidthMouseUp}
						/>
					</div>

					<h3>Accent color</h3>
					<div
						ref={colorSwatchRef}
						className='accent-color-swatch'
						onClick={() => setShowAccentPicker(true)}
					/>
					{showAccentPicker && (
						<PopperContainer
							referenceElement={colorSwatchRef.current}
							closeFn={() => setShowAccentPicker(false)}>
							<div className='accent-color-swatch-picker'>
								<SketchPicker
									disableAlpha={true}
									color={primaryColor}
									width={160}
									onChange={(color) => {
										const rootElement = document.querySelector(':root');
										rootElement.style.setProperty('--color-primary', color.hex);
										rootElement.style.setProperty(
											'--color-primary-rgb',
											`${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`
										);
										setPrimaryColor(color.hex);
									}}
								/>
							</div>
						</PopperContainer>
					)}

					<h3>Default font</h3>
					<h3>Default font size</h3>
					<h3>Default line spacing</h3>
					<ul>
						<li>Requires project level settings</li>
					</ul>
				</div>
			</ResizableWindow>
		</>
	);
};

export default EditorSettings;
