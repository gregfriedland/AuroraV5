{
  "targets": [
    {
      "target_name": "alienblob",
      "sources": [ "alienblob.cc" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}	