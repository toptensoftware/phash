function globToRx(glob)
{
    let rx = "^";

    if (!(glob.startsWith("/") || glob.startsWith("\\")))
    {
        // "**/"
        rx += "(?:[^/\\\\]*[/\\\\])*";
    }

    for (let i=0; i<glob.length; i++)
    {
        let ch = glob[i];

        switch (ch)
        {
            case '?':
                // How many?
                let length = 1;
                while (i + length < glob.length && glob[i + length] == '?')
                    length++;
                i += length - 1;

                // Any Character (except slash)
                if (length > 1)
                    rx += `([^/\\\\]{${length}})`;
                else
                    rx += `([^/\\\\])`;
                break;

            case '*':
                if (i + 1 < glob.length && glob[i+1] == '*')
                {
                    if (i + 2 == glob.length)
                    {
                        // ** at end, accept anything
                        rx += "(.*)";
                        i++;
                        continue;
                    }

                    if (glob[i+2] == '/' || glob[i+2] == '\\')
                    {
                        // '**/" accept anything up to slash
                        rx += "((?:[^/\\\\]*[/\\\\])*)";
                        i+=2;           // also consume the '/' from the glob pattern
                        continue;
                    }
                }

                // Any Characters (except slash)
                rx += "([^/\\\\]*)";
                break;

            case '[':
                // Character class
                rx += '[';
                i++;
                if (i < glob.length)
                {
                    if (glob[i] == '!')
                    {
                        rx += '^';
                        i++;
                    }
                }
                while (i < glob.length && glob[i] != ']')
                {
                    if (glob[i] == '\\')
                    {
                        rx += '\\';
                        i++;
                        if (i < glob.length)
                            rx += glob[i++];
                    }
                    else
                    {
                        rx += glob[i++];
                    }
                }
                rx += ']';
                break;
            
            case '\\':
            case '/':
                rx += "[/\\\\]";
                break;

            case ']':
            case '{':
            case '}':
            case '(':
            case ')':
            case '<':
            case '>':
            case '+':
            case '-':
            case '=':
            case '!':
            case '?':
            case '^':
            case '$':
            case '|':
            case '.':
                // Escaped characters
                rx += '\\' + ch;
                break;

            default:
                // Literal character
                rx += ch;
                break;
        }
    }

    // If pattern doesn't end with a slash then match
    // either file or directory
    if (!(glob.endsWith('/') ||glob.endsWith('\\')) && !glob.endsWith('*'))
        rx += "[/\\\\]?"

    rx += '$';
    return rx;
}


function do_unit_tests()
{
    function test(pattern, file, shouldMatch)
    {
        if (!file.startsWith('/'))
            file = "/" + file;

        let rx = new RegExp(globToRx(pattern), "");
        if ((file.match(rx) != null) != shouldMatch)
        {
            console.error(`FAILED: pattern:'${pattern}' ('${rx}') vs filename:'${file}' gave ${!shouldMatch}`)
        }
    }

    // Basic file character matching
    test("a.txt", "b.txt", false);
    test("file.txt", "file.txt", true);
    test("file.txt", "file.exe", false);
    test("file.*", "file.txt", true);
    test("file.*", "file2.txt", false);
    test("*.txt", "file.txt", true);
    test("*.txt", "file.exe", false);
    test("*.???", "file.txt", true);
    test("*.??", "file.txt", false);

    // Directory vs file matching
    test("dir", "dir", true);
    test("dir", "dir/", true);
    test("dir/", "dir", false);
    test("dir/", "dir/", true);

    // Explicit root directory
    test("/file.txt", "/file.txt", true);
    test("/file.txt", "/dir/file.txt", false);
    test("/dir/file.txt", "/dir/file.txt", true);

    // Directory wildcard at start
    test("**/foo/bar", "/foo/bar", true);
    test("**/foo/bar", "/a/foo/bar", true);
    test("**/foo/bar", "/a/b/foo/bar", true);

    // Directory wildcard at start with preceeding /
    test("/**/foo/bar", "/foo/bar", true);
    test("/**/foo/bar", "/a/foo/bar", true);
    test("/**/foo/bar", "/a/b/foo/bar", true);

    // Directory wildcard in middle
    test("/dir/**/file.txt", "/dir/file.txt", true);
    test("/dir/**/file.txt", "/dir/a/file.txt", true);
    test("/dir/**/file.txt", "/dir/a/b/file.txt", true);

    // Directory wildcard at end
    test("/dir/**", "/dir/foo", true);
    test("/dir/**", "/dir/foo/bar", true);

    // Directory wildcard at end with trailin slash
    test("/dir/**/", "/dir/foo/", true);
    test("/dir/**/", "/dir/foo/bar/", true);
    test("/dir/**/", "/dir/foo", false);
    test("/dir/**/", "/dir/foo/bar", false);

    test("/dir/**/file.txt", "/a/dir/a/b/file.txt", false);

    test("dir/**/file.txt", "/a/b/dir/file.txt", true);
    test("dir/**/file.txt", "/a/b/dir/a/file.txt", true);
    test("dir/**/file.txt", "/a/b/dir/a/b/file.txt", true);

    console.log("done");
}

do_unit_tests();

module.exports = globToRx;