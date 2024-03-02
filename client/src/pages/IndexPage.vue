<template>
  <q-page class="row items-center justify-evenly">
    testing 1, 2, 3
  </q-page>
</template>

<script setup lang="ts">
import PouchDB from 'pouchdb'

const jwtFetch = (url: string | Request, opts: any) => {
  if (typeof opts === 'undefined') opts = {}
  if (typeof opts.headers === 'undefined' || opts.headers === null) opts.headers = new Headers()
  if (!(opts.headers instanceof Headers)) opts.headers = new Headers(opts.headers)
  opts.headers.set('Bearer-Token', useAuthenticationStore().getBearerToken())
  return PouchDB.fetch(url, opts)
}

const db = new PouchDB('http://localhost:5984', {
  fetch: jwtFetch,
  skip_setup: true
})

const syncOptions = {
  live: true,
  retry: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetch: jwtFetch,
  skip_setup: true
}

const localDB = new PouchDB('BigBrainEnergy')

localDB.sync(db, syncOptions)
  .on('change', function (info) {
    console.log({ info })
  })
  .on('paused', function (err) {
    // replication paused (e.g., replication up to date, user went offline)
    console.error({ err })
  })
  .on('active', function () {
    // replicate resumed (e.g., new changes replicating, user went back online)
    console.info('Replication has resumed')
  })
  .on('denied', function (err) {
    // a document failed to replicate (e.g., due to permissions)
    console.error({ err })
  })
  .on('complete', function (info) {
    // handle complete
    console.info({ info })
  })
  .on('error', function (err) {
    // handle error
    console.error({ err })
  })
</script>: string | Request: RequestInit | undefined: string | Request: RequestInit | undefined
