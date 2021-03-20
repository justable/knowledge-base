import { createElement, cloneElement, isValidElement } from './ReactElement'
import {
  REACT_FRAGMENT_TYPE,
  REACT_PROFILER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE
} from '../shared/react/ReactSymbols'
import { forEach, map, count, toArray, only } from './ReactChildren'
import { createRef } from './ReactCreateRef'
import { Component, PureComponent } from './ReactBaseClasses'
import { createContext } from './ReactContext'
import forwardRef from './forwardRef'
import { lazy } from './ReactLazy'
import memo from './memo'
import {
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} from './ReactHooks'

const React = {
  Children: { forEach, map, count, toArray, only },

  createRef,
  Component,
  PureComponent,

  createContext,
  forwardRef,
  lazy,
  memo,

  Fragment: REACT_FRAGMENT_TYPE,
  Profiler: REACT_PROFILER_TYPE,
  StrictMode: REACT_STRICT_MODE_TYPE,
  Suspense: REACT_SUSPENSE_TYPE,

  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,

  createElement,
  cloneElement,
  isValidElement
}

export default React
