---
description : How to build your own endpoints.
permalink : Guides/Custom-Endpoints
title : Custom Endpoints
---

The following code snippets showcase  
how you can return content based on a  
client query via a search query.

<br/>

### layout/theme.liquid

Propagates alternative layouts. 

```liquid
{%- liquid

    #
    #   Layout : 𝗧𝗵𝗲𝗺𝗲
    #

    ############################################################################

    capture layout
        render 'Layout'
    endcapture

    ############################################################################

    unless layout == blank
        echo layout
        break
    endunless

-%}


<html>
    ... 
</html>
```

<br/>

### snippets/Layout.liquid

Renders alternative layouts.

```liquid
{%- liquid

    #
    #   Snippet : 𝗟𝗮𝘆𝗼𝘂𝘁
    #

    #
    #   𝗣𝗮𝗿𝗮𝗺𝗲𝘁𝗲𝗿𝘀
    #   @ request
    #

    ############################################################################

    assign type = request.page_type

    ############################################################################

    if type == 'search'
        render 'Endpoints'
        break
    endif

-%}
```

<br/>

### snippets/Endpoints.liquid

Checks whether the search query starts with a given marker.

```liquid
{%- liquid

    #
    #   Snippet : 𝗘𝗻𝗱𝗽𝗼𝗶𝗻𝘁𝘀
    #

    #
    #   𝗣𝗮𝗿𝗮𝗺𝗲𝘁𝗲𝗿𝘀
    #   @ search
    #

    ############################################################################

    assign query = search.terms

    assign initial = query | truncate : 1 , ''

    ############################################################################

    unless initial == '🐱'
        break
    endunless

    ############################################################################

    assign query = query | remove_first : initial

    ############################################################################

    render 'Endpoint-Cats' with query

-%}
```

<br/>

### snippets/Endpoint-Cats.liquid

Returns JSON with as many 🐱s as the query specified.

```liquid
{%- liquid

    #
    #   Snippet : 𝗘𝗻𝗱𝗽𝗼𝗶𝗻𝘁 - 𝗖𝗮𝘁𝘀
    #

    #
    #   𝗣𝗮𝗿𝗮𝗺𝗲𝘁𝗲𝗿𝘀
    #   $ Endpoint-Cats : String
    #

    ############################################################################

    assign query = Endpoint-Cats

    ############################################################################

    capture cats

        for i in (1..query)
            echo '🐱'
        endfor

    endcapture

-%}

{
    "cats" : {{ cats | json }}
}
```

<br/>

### Output

When you navigate to `/search?q=🐱20`

![Text Cats](Images/Cats-Text.webp)

When you open to `/search.json?q=🐱20`

![JSON Cats](Images/Cats-JSON.webp)
