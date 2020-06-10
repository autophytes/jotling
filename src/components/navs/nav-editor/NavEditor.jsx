import React from 'react';

import PushpinSVG from '../../../assets/svg/PushpinSVG';
import IncreaseFontSizeSVG from '../../../assets/svg/editor/IncreaseFontSizeSVG';
import DecreaseFontSizeSVG from '../../../assets/svg/editor/DecreaseFontSizeSVG';
import BoldSVG from '../../../assets/svg/editor/BoldSVG';
import ItalicSVG from '../../../assets/svg/editor/ItalicSVG';
import UnderlineSVG from '../../../assets/svg/editor/UnderlineSVG';
import StrikethroughSVG from '../../../assets/svg/editor/StrikethroughSVG';
import SubscriptSVG from '../../../assets/svg/editor/SubscriptSVG';
import SuperscriptSVG from '../../../assets/svg/editor/SuperscriptSVG';
import HighlightSVG from '../../../assets/svg/editor/HighlightSVG';
import TextColorSVG from '../../../assets/svg/editor/TextColorSVG';
import FillColorSVG from '../../../assets/svg/editor/FillColorSVG';
import ListBulletSVG from '../../../assets/svg/editor/ListBulletSVG';
import ListNumberSVG from '../../../assets/svg/editor/ListNumberSVG';
import AlignLeftSVG from '../../../assets/svg/editor/AlignLeftSVG';
import AlignCenterSVG from '../../../assets/svg/editor/AlignCenterSVG';
import AlignRightSVG from '../../../assets/svg/editor/AlignRightSVG';
import AlignJustifySVG from '../../../assets/svg/editor/AlignJustifySVG';
import LineSpacingSVG from '../../../assets/svg/editor/LineSpacingSVG';
import SpellcheckSVG from '../../../assets/svg/editor/SpellcheckSVG';

const NavEditor = () => {
	return (
		<nav className='editor-nav'>
			<button className='nav-button'>
				{/* <img src='icons/pushpin.svg' /> */}
				<PushpinSVG />
			</button>
			{/* <!-- Should most of these be document-wide rather than selection specific? --> */}
			<select>
				<option value='Calibri'>Calibri</option>
				<option value='PT Sans'>PT Sans</option>
				<option value='Open Sans'>Open Sans</option>
				<option value='temporary'>Note: use systems</option>
			</select>
			<select>
				<option value='12'>12</option>
				<option value='14'>14</option>
				<option value='16'>16</option>
				<option value='18'>18</option>
			</select>
			<button className='nav-button'>
				{/* <img src='icons/034-format-size.svg' /> */}
				<IncreaseFontSizeSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/006-text-1.svg' /> */}
				<DecreaseFontSizeSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/048-bold.svg' /> */}
				<BoldSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/041-italic.svg' /> */}
				<ItalicSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/030-underline.svg' /> */}
				<UnderlineSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/007-strikethrough-1.svg' /> */}
				<StrikethroughSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/subscript.svg' /> */}
				<SubscriptSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/superscript.svg' /> */}
				<SuperscriptSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/063-edit.svg' /> */}
				<HighlightSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/044-format.svg' /> */}
				<TextColorSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/046-fill.svg' /> */}
				<FillColorSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/039-list.svg' /> */}
				<ListBulletSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/038-list-1.svg' /> */}
				<ListNumberSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/050-left-align.svg' /> */}
				<AlignLeftSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/052-align-center.svg' /> */}
				<AlignCenterSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/049-right-align.svg' /> */}
				<AlignRightSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/051-justify.svg' /> */}
				<AlignJustifySVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/040-spacing.svg' /> */}
				<LineSpacingSVG />
			</button>
			<button className='nav-button'>
				{/* <img src='icons/040-spacing.svg' /> */}
				<SpellcheckSVG />
			</button>
		</nav>
	);
};

export default NavEditor;
