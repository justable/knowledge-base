import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import {
  MemoryRouter as Router,
  Routes,
  Route,
  Link
} from '../../react-router-dom'

describe('<Link>', () => {
  const Home: React.FC = () => <div data-testid="home">Home</div>
  const About: React.FC = () => <div data-testid="about">About</div>

  it('跳转页面', () => {
    render(
      <Router initialEntries={['/home']}>
        <div>
          <Link to="home">Home</Link>
          <Link to="about">About</Link>
        </div>
        <Routes>
          <Route path="home" element={<Home />}></Route>
          <Route path="about" element={<About />}></Route>
        </Routes>
      </Router>
    )
    expect(screen.getByTestId('home')).toBeInTheDocument()
    // 不存在getByTestId会报错所以用queryByTestId
    expect(screen.queryByTestId('about')).not.toBeInTheDocument()

    const linkAbout = screen.getByText('About')
    fireEvent.click(linkAbout)

    expect(screen.queryByTestId('home')).not.toBeInTheDocument()
    expect(screen.getByTestId('about')).toBeInTheDocument()
  })

  it('会阻止 target=_blank', () => {
    render(
      <Router initialEntries={['/home']}>
        <div>
          <Link to="home">Home</Link>
          <Link to="about" target="_blank">
            About
          </Link>
        </div>
        <Routes>
          <Route path="home" element={<Home />}></Route>
          <Route path="about" element={<About />}></Route>
        </Routes>
      </Router>
    )
    expect(screen.getByTestId('home')).toBeInTheDocument()
    expect(screen.queryByTestId('about')).not.toBeInTheDocument()

    const linkAbout = screen.getByText('About')
    fireEvent.click(linkAbout)

    expect(screen.getByTestId('home')).toBeInTheDocument()
    expect(screen.queryByTestId('about')).not.toBeInTheDocument()
  })

  it('会阻止 ctrl + 左键', () => {
    render(
      <Router initialEntries={['/home']}>
        <div>
          <Link to="home">Home</Link>
          <Link to="about">About</Link>
        </div>
        <Routes>
          <Route path="home" element={<Home />}></Route>
          <Route path="about" element={<About />}></Route>
        </Routes>
      </Router>
    )
    expect(screen.getByTestId('home')).toBeInTheDocument()
    expect(screen.queryByTestId('about')).not.toBeInTheDocument()

    const linkAbout = screen.getByText('About')
    fireEvent.click(linkAbout, {
      ctrlKey: true
    })
    // lib.dom.d.ts
    // fireEvent(
    //   screen.getByText('About'),
    //   new MouseEvent('click', {
    //     view: window,
    //     bubbles: true,
    //     cancelable: true,
    //     // The Ctrl key is pressed
    //     ctrlKey: true
    //   })
    // )

    expect(screen.getByTestId('home')).toBeInTheDocument()
    expect(screen.queryByTestId('about')).not.toBeInTheDocument()
  })

  it('会阻止右键', () => {
    render(
      <Router initialEntries={['/home']}>
        <div>
          <Link to="home">Home</Link>
          <Link to="about">About</Link>
        </div>
        <Routes>
          <Route path="home" element={<Home />}></Route>
          <Route path="about" element={<About />}></Route>
        </Routes>
      </Router>
    )
    expect(screen.getByTestId('home')).toBeInTheDocument()
    expect(screen.queryByTestId('about')).not.toBeInTheDocument()

    const linkAbout = screen.getByText('About')
    fireEvent.click(linkAbout, {
      button: 2
    })

    expect(screen.getByTestId('home')).toBeInTheDocument()
    expect(screen.queryByTestId('about')).not.toBeInTheDocument()
  })
})
