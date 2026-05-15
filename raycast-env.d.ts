/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `open-course` command */
  export type OpenCourse = ExtensionPreferences & {}
  /** Preferences accessible in the `manage-courses` command */
  export type ManageCourses = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `open-course` command */
  export type OpenCourse = {}
  /** Arguments passed to the `manage-courses` command */
  export type ManageCourses = {}
}

