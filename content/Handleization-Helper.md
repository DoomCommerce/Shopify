---
description : Small helper snippet for pre-process textarea handles.
permalink : Guides/Textarea-Handleization
title : Textarea Handleization
---

The following code snippet helps preprocessing  
& filtering out handles from a textarea setting.

<br/>

### snippets/Handleize.liquid

```liquid
{%- liquid

    #
    #   Snippet : 𝗛𝗮𝗻𝗱𝗹𝗲𝗶𝘇𝗲
    #

    #
    #   𝗣𝗮𝗿𝗮𝗺𝗲𝘁𝗲𝗿𝘀
    #   $ Handleize : String
    #

    ############################################################################

    assign BreakTag = '<br />'

    ############################################################################

    assign input = Handleize

    ############################################################################

    if input == blank
        break
    endif

    ############################################################################

    assign input = input | strip

    assign lines = input | newline_to_br | split : BreakTag

    ############################################################################

    for line in lines

        if line == blank
            continue
        endif

        echo line | handleize

        unless forloop.last
            echo ','
        endunless

    endfor

-%}
```

**Don't forget to remove any whitespace before & after the liquid block as**  
**- at the point of writing - there is still a bug that inserts a newline at the**  
**start of the output of every snippet when whitespace is present.**

<br/>

### Test.liquid

```liquid

{%- capture text -%}

    handle-1

    Readable-But-Wrong-Case-Handle

{%- endcapture -%}

{%- liquid

    capture handles
        render 'Handleize' with text
    endcapture

-%}

[{{ handles }}]
```

### Output

```txt
[handle-1,readable-but-wrong-case-handle]
```

<br/>
