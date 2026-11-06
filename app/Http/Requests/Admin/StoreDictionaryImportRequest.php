<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

class StoreDictionaryImportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'language_id' => ['required', 'integer', 'exists:languages,id'],
            'file' => ['required', 'file', 'mimes:pdf', 'max:25600'],
        ];
    }

    /**
     * Reject files that do not actually contain a PDF header.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->has('file')) {
                return;
            }

            $file = $this->file('file');

            if (! $file instanceof UploadedFile) {
                return;
            }

            if (! $file->isValid() || $file->getSize() <= 0) {
                $validator->errors()->add('file', 'The uploaded PDF is empty or was not received correctly.');

                return;
            }

            $handle = @fopen($file->getRealPath(), 'rb');
            $header = $handle !== false ? fread($handle, 1024) : false;

            if ($handle !== false) {
                fclose($handle);
            }

            if ($header === false || ! str_contains($header, '%PDF-')) {
                $validator->errors()->add('file', 'The uploaded file is not a valid PDF.');
            }
        });
    }
}
