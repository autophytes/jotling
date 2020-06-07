import React from 'react';

const NavEditor = () => {
	return (
		<nav className='editor-nav'>
			<button className='nav-button'>
				<img src='icons/pushpin.svg' />
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
				<img src='icons/034-format-size.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/006-text-1.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/048-bold.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/041-italic.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/030-underline.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/007-strikethrough-1.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/subscript.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/superscript.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/063-edit.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/044-format.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/046-fill.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/039-list.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/038-list-1.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/050-left-align.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/052-align-center.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/049-right-align.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/051-justify.svg' />
			</button>
			<button className='nav-button'>
				<img src='icons/040-spacing.svg' />
			</button>
		</nav>
	);
};

export default NavEditor;
